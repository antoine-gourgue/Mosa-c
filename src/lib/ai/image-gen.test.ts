import { describe, expect, it, vi } from "vitest";
import { createImageGenerator } from "./image-gen";

/**
 * Builds a fetch stub returning a Cloudflare Workers AI JSON response.
 */
function cfResponse(body: unknown, ok = true): typeof fetch {
  return vi.fn(
    async () =>
      ({
        ok,
        json: async () => body,
      }) as unknown as Response,
  );
}

const creds = { accountId: "acc_123", token: "tok_456", baseUrl: "https://cf.test/accounts" };

describe("createImageGenerator", () => {
  it("returns null and skips the network for a blank prompt", async () => {
    const fetchImpl = cfResponse({ success: true, result: { image: "abc" } });
    const generate = createImageGenerator({ ...creds, fetchImpl });
    expect(await generate("   ")).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns null and skips the network when credentials are missing", async () => {
    const fetchImpl = cfResponse({ success: true, result: { image: "abc" } });
    const generate = createImageGenerator({ fetchImpl });
    expect(await generate("a sunset")).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns a base64 data URL and the configured dimensions on success", async () => {
    const generate = createImageGenerator({
      ...creds,
      fetchImpl: cfResponse({ success: true, result: { image: "BASE64DATA" } }),
      width: 512,
      height: 512,
    });
    const result = await generate("a misty mountain lake");
    expect(result?.dataUrl).toBe("data:image/jpeg;base64,BASE64DATA");
    expect(result).toMatchObject({ width: 512, height: 512 });
  });

  it("posts the prompt and steps to the model run endpoint with a bearer token", async () => {
    const fetchImpl = cfResponse({ success: true, result: { image: "x" } });
    const generate = createImageGenerator({ ...creds, fetchImpl, steps: 6 });
    await generate("a cat & dog");
    const [url, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://cf.test/accounts/acc_123/ai/run/@cf/black-forest-labs/flux-1-schnell",
    );
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer tok_456");
    expect(JSON.parse(init.body as string)).toEqual({ prompt: "a cat & dog", steps: 6 });
  });

  it("returns null on a non-ok response", async () => {
    const generate = createImageGenerator({
      ...creds,
      fetchImpl: cfResponse({ success: false }, false),
    });
    expect(await generate("prompt")).toBeNull();
  });

  it("returns null when the response is not successful", async () => {
    const generate = createImageGenerator({
      ...creds,
      fetchImpl: cfResponse({ success: false, result: { image: "x" } }),
    });
    expect(await generate("prompt")).toBeNull();
  });

  it("returns null when the image field is missing or empty", async () => {
    const missing = createImageGenerator({
      ...creds,
      fetchImpl: cfResponse({ success: true, result: {} }),
    });
    expect(await missing("prompt")).toBeNull();
    const empty = createImageGenerator({
      ...creds,
      fetchImpl: cfResponse({ success: true, result: { image: "" } }),
    });
    expect(await empty("prompt")).toBeNull();
  });

  it("lets a single call override the configured size", async () => {
    const fetchImpl = cfResponse({ success: true, result: { image: "x" } });
    const generate = createImageGenerator({ ...creds, fetchImpl, width: 768, height: 1024 });
    const result = await generate("a sunset", { width: 512, height: 512 });
    expect(result).toMatchObject({ width: 512, height: 512 });
  });

  it("returns null when the request throws", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const generate = createImageGenerator({ ...creds, fetchImpl });
    expect(await generate("prompt")).toBeNull();
  });

  it("aborts and returns null when generation exceeds the timeout", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          (init.signal as AbortSignal).addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
    ) as unknown as typeof fetch;
    const generate = createImageGenerator({ ...creds, fetchImpl, timeoutMs: 5 });
    expect(await generate("prompt")).toBeNull();
  });
});
