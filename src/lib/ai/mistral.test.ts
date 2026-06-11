import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMistralProvider, type MistralConfig } from "./mistral";

/**
 * Builds a fetch mock that resolves to a JSON body with the given status, typed
 * as `fetch` so it can be injected into the provider.
 */
function jsonFetch(body: unknown, ok = true): typeof fetch {
  return vi
    .fn()
    .mockResolvedValue({ ok, json: () => Promise.resolve(body) }) as unknown as typeof fetch;
}

/**
 * Creates a provider with the test hooks (no throttle delay, a fake key) merged
 * over the given overrides.
 */
function provider(overrides: Partial<MistralConfig> = {}) {
  return createMistralProvider({ apiKey: "k", minIntervalMs: 0, ...overrides });
}

const CHAT = { choices: [{ message: { content: "A red bike on a wall." } }] };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("available", () => {
  it("is true with a key and false without", () => {
    expect(provider({ apiKey: "k" }).available()).toBe(true);
    expect(provider({ apiKey: undefined }).available()).toBe(false);
    expect(provider({ apiKey: "" }).available()).toBe(false);
  });
});

describe("describeImage", () => {
  it("returns the model's description and calls the chat endpoint", async () => {
    const fetchImpl = jsonFetch(CHAT);
    const result = await provider({ fetchImpl }).describeImage("https://img/x.jpg");
    expect(result).toBe("A red bike on a wall.");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.mistral.ai/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("no-ops to null without an API key (no request)", async () => {
    const fetchImpl = jsonFetch(CHAT);
    expect(await provider({ apiKey: undefined, fetchImpl }).describeImage("x")).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns null on a non-2xx response", async () => {
    const fetchImpl = jsonFetch({}, false);
    expect(await provider({ fetchImpl }).describeImage("x")).toBeNull();
  });

  it("returns null when the request throws", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network"));
    expect(await provider({ fetchImpl }).describeImage("x")).toBeNull();
  });
});

describe("suggestTags", () => {
  it("parses a comma list into clean, deduplicated, capped tags", async () => {
    const fetchImpl = jsonFetch({
      choices: [{ message: { content: "Bikes, #Cycling, cycling, URBAN, a, b, c, d, e, f" } }],
    });
    const tags = await provider({ fetchImpl }).suggestTags({ title: "My ride" });
    expect(tags).toEqual(["bikes", "cycling", "urban", "a", "b", "c", "d", "e"]);
  });

  it("includes the image in the request when provided", async () => {
    const fetchImpl = jsonFetch({ choices: [{ message: { content: "art" } }] });
    await provider({ fetchImpl }).suggestTags({ imageUrl: "https://img/x.jpg" });
    const call = (fetchImpl as unknown as Mock).mock.calls[0];
    const body = JSON.parse(call?.[1].body as string);
    expect(body.messages[0].content).toContainEqual({
      type: "image_url",
      image_url: "https://img/x.jpg",
    });
  });

  it("returns an empty list without a key or on failure", async () => {
    expect(await provider({ apiKey: undefined }).suggestTags({ title: "x" })).toEqual([]);
    const fetchImpl = jsonFetch({}, false);
    expect(await provider({ fetchImpl }).suggestTags({ title: "x" })).toEqual([]);
  });
});

describe("embed", () => {
  it("returns the embedding vector", async () => {
    const fetchImpl = jsonFetch({ data: [{ embedding: [0.1, 0.2, 0.3] }] });
    const result = await provider({ fetchImpl }).embed("hello");
    expect(result).toEqual([0.1, 0.2, 0.3]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.mistral.ai/v1/embeddings",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns null on a malformed response", async () => {
    const fetchImpl = jsonFetch({ data: [{ embedding: "nope" }] });
    expect(await provider({ fetchImpl }).embed("hello")).toBeNull();
  });
});

describe("throttle", () => {
  it("spaces consecutive requests by the configured interval", async () => {
    let clock = 1000;
    const sleeps: number[] = [];
    const sleepImpl = (ms: number): Promise<void> => {
      sleeps.push(ms);
      clock += ms;
      return Promise.resolve();
    };
    const fetchImpl = jsonFetch(CHAT);
    const ai = provider({ fetchImpl, minIntervalMs: 500, now: () => clock, sleepImpl });
    await ai.describeImage("a");
    await ai.describeImage("b");
    expect(sleeps).toEqual([500]);
  });
});
