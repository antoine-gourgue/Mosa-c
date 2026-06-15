/**
 * Text-to-image generation backed by Cloudflare Workers AI (FLUX.1 [schnell]) —
 * a free daily allowance that only needs a (free) Cloudflare account id and API
 * token. The model returns a base64 image, which is wrapped into a data URL the
 * create flow can turn into a file. The `fetchImpl`, `accountId`, `token` and
 * `baseUrl` knobs are injectable so the generator can be unit-tested without a
 * real account or network call.
 */

/**
 * A generated image as a base64 data URL with the dimensions it was rendered at.
 */
export type GeneratedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

/**
 * Per-call sizing overrides for a generation, falling back to the generator's
 * configured defaults.
 */
export type ImageGenOptions = {
  width?: number;
  height?: number;
};

/**
 * A text-to-image generator: maps a prompt (with optional per-call sizing) to an
 * image, or null on failure.
 */
export type ImageGenerator = (
  prompt: string,
  options?: ImageGenOptions,
) => Promise<GeneratedImage | null>;

/**
 * Configuration for {@link createImageGenerator}.
 */
export type ImageGenConfig = {
  fetchImpl?: typeof fetch;
  accountId?: string;
  token?: string;
  baseUrl?: string;
  timeoutMs?: number;
  steps?: number;
  width?: number;
  height?: number;
};

const API_BASE = "https://api.cloudflare.com/client/v4/accounts";
const MODEL = "@cf/black-forest-labs/flux-1-schnell";
const DEFAULT_WIDTH = 768;
const DEFAULT_HEIGHT = 1024;
const DEFAULT_STEPS = 3;
const DEFAULT_TIMEOUT_MS = 45_000;

/**
 * Builds a text-to-image generator bound to a Cloudflare account. A blank
 * prompt, or missing credentials, resolves to null without a network call; the
 * request is time-bounded; and any network, unsuccessful or malformed response
 * degrades to null rather than throwing — so the create flow stays usable when
 * generation is unavailable.
 *
 * @param config - Injectable fetch, Cloudflare credentials and sizing knobs.
 * @returns The generator function.
 */
export function createImageGenerator(config: ImageGenConfig = {}): ImageGenerator {
  const fetchImpl = config.fetchImpl ?? fetch;
  const accountId = config.accountId ?? "";
  const token = config.token ?? "";
  const baseUrl = config.baseUrl ?? API_BASE;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const steps = config.steps ?? DEFAULT_STEPS;
  const width = config.width ?? DEFAULT_WIDTH;
  const height = config.height ?? DEFAULT_HEIGHT;

  return async (prompt: string, options?: ImageGenOptions): Promise<GeneratedImage | null> => {
    const trimmed = prompt.trim();
    if (trimmed === "" || accountId === "" || token === "") {
      return null;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${baseUrl}/${accountId}/ai/run/${MODEL}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, steps }),
        signal: controller.signal,
      });
      if (!response.ok) {
        return null;
      }
      const data = (await response.json()) as { success?: boolean; result?: { image?: unknown } };
      const image = data.result?.image;
      if (data.success !== true || typeof image !== "string" || image === "") {
        return null;
      }
      return {
        dataUrl: `data:image/jpeg;base64,${image}`,
        width: options?.width ?? width,
        height: options?.height ?? height,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
}
