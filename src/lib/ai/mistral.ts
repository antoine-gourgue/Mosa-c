import type { AiProvider, TagSuggestionInput } from "./types";

/**
 * Mistral REST API base. Pixtral handles vision (image description + tagging);
 * `mistral-embed` produces embeddings.
 */
const API_BASE = "https://api.mistral.ai/v1";
const VISION_MODEL = "pixtral-12b-2409";
const EMBED_MODEL = "mistral-embed";

/**
 * Default per-request timeout and the minimum spacing between requests. The free
 * tier is rate-limited, so calls are serialized and spaced out here, centrally,
 * for every AI feature to reuse.
 */
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MIN_INTERVAL_MS = 600;
const MAX_TAGS = 8;

/**
 * Configuration for {@link createMistralProvider}. The `fetch`, `now` and
 * interval knobs are injectable so the provider can be unit-tested without real
 * network or timers.
 */
export type MistralConfig = {
  apiKey: string | undefined;
  fetchImpl?: typeof fetch;
  now?: () => number;
  sleepImpl?: (ms: number) => Promise<void>;
  minIntervalMs?: number;
  timeoutMs?: number;
};

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - The delay in milliseconds.
 * @returns A promise that resolves after the delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reads the assistant text from a chat-completions response, or null when the
 * shape is unexpected.
 *
 * @param data - The parsed JSON response.
 * @returns The message content, or null.
 */
function readContent(data: unknown): string | null {
  const choice = (data as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0];
  const content = choice?.message?.content;
  return typeof content === "string" && content.trim() !== "" ? content.trim() : null;
}

/**
 * Reads the first embedding vector from an embeddings response, or null.
 *
 * @param data - The parsed JSON response.
 * @returns The embedding, or null.
 */
function readEmbedding(data: unknown): number[] | null {
  const embedding = (data as { data?: { embedding?: unknown }[] })?.data?.[0]?.embedding;
  return Array.isArray(embedding) && embedding.every((n) => typeof n === "number")
    ? (embedding as number[])
    : null;
}

/**
 * Parses a comma-separated tag reply into clean, deduplicated, lowercase tags.
 *
 * @param text - The model's raw reply.
 * @returns Up to {@link MAX_TAGS} tags.
 */
function parseTags(text: string): string[] {
  const seen = new Set<string>();
  for (const raw of text.split(/[,\n]/)) {
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/^[#-]+/, "")
      .replace(/[^a-z0-9 ]/g, "")
      .trim();
    if (tag !== "" && tag.length <= 30) {
      seen.add(tag);
    }
    if (seen.size >= MAX_TAGS) {
      break;
    }
  }
  return [...seen];
}

/**
 * Creates a Mistral-backed {@link AiProvider}. Requests are serialized and
 * spaced by `minIntervalMs` to respect the free-tier rate limit, time out after
 * `timeoutMs`, and never throw — any failure (no key, non-2xx, network, timeout)
 * resolves to null / an empty list so callers are never blocked by AI.
 *
 * @param config - The API key and injectable test hooks.
 * @returns The provider.
 */
export function createMistralProvider(config: MistralConfig): AiProvider {
  const apiKey = config.apiKey;
  const fetchImpl = config.fetchImpl ?? fetch;
  const now = config.now ?? Date.now;
  const sleep = config.sleepImpl ?? delay;
  const minInterval = config.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let queue: Promise<unknown> = Promise.resolve();
  let lastAt = 0;

  const available = (): boolean => apiKey !== undefined && apiKey !== "";

  /**
   * Serializes a task behind the queue and spaces it from the previous call.
   */
  function schedule<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(async () => {
      const wait = lastAt + minInterval - now();
      if (wait > 0) {
        await sleep(wait);
      }
      lastAt = now();
      return task();
    });
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  /**
   * Posts a JSON body to the Mistral API and returns the parsed JSON, or null on
   * any failure. No-ops (returns null) when unconfigured.
   */
  async function post(path: string, body: unknown): Promise<unknown | null> {
    if (!available()) {
      return null;
    }
    return schedule(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(`${API_BASE}${path}`, {
          method: "POST",
          headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok) {
          return null;
        }
        return await response.json();
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    });
  }

  async function describeImage(imageUrl: string): Promise<string | null> {
    const data = await post("/chat/completions", {
      model: VISION_MODEL,
      max_tokens: 120,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image in one concise sentence." },
            { type: "image_url", image_url: imageUrl },
          ],
        },
      ],
    });
    return readContent(data);
  }

  async function suggestTags(input: TagSuggestionInput): Promise<string[]> {
    const context: string[] = [];
    if (input.title != null && input.title !== "") {
      context.push(`Title: ${input.title}`);
    }
    if (input.description != null && input.description !== "") {
      context.push(`Description: ${input.description}`);
    }
    const content: unknown[] = [
      {
        type: "text",
        text:
          "Suggest 5 to 8 short lowercase topic tags (one or two words each) for this pin. " +
          "Reply with only a comma-separated list, no hashtags." +
          (context.length > 0 ? `\n${context.join("\n")}` : ""),
      },
    ];
    if (input.imageUrl != null && input.imageUrl !== "") {
      content.push({ type: "image_url", image_url: input.imageUrl });
    }
    const data = await post("/chat/completions", {
      model: VISION_MODEL,
      max_tokens: 80,
      messages: [{ role: "user", content }],
    });
    const text = readContent(data);
    return text === null ? [] : parseTags(text);
  }

  async function embed(text: string): Promise<number[] | null> {
    const data = await post("/embeddings", { model: EMBED_MODEL, input: [text] });
    return readEmbedding(data);
  }

  return { available, describeImage, suggestTags, embed };
}
