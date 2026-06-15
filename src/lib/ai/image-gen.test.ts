import { describe, expect, it, vi } from "vitest";
import { createImageGenerator } from "./image-gen";

/**
 * Builds a fetch stub returning an image response with the given bytes.
 */
function imageResponse(bytes: number[], contentType = "image/png", ok = true): typeof fetch {
  return vi.fn(
    async () =>
      ({
        ok,
        headers: {
          get: (key: string) => (key.toLowerCase() === "content-type" ? contentType : null),
        },
        arrayBuffer: async () => new Uint8Array(bytes).buffer,
      }) as unknown as Response,
  );
}

describe("createImageGenerator", () => {
  it("returns null and skips the network for a blank prompt", async () => {
    const fetchImpl = imageResponse([1, 2, 3]);
    const generate = createImageGenerator({ fetchImpl });
    expect(await generate("   ")).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns a base64 data URL and the requested dimensions on success", async () => {
    const generate = createImageGenerator({
      fetchImpl: imageResponse([0, 1, 2, 3]),
      width: 512,
      height: 512,
    });
    const result = await generate("a misty mountain lake");
    expect(result?.dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(result).toMatchObject({ width: 512, height: 512 });
  });

  it("encodes the prompt and sends the size, model and a User-Agent", async () => {
    const fetchImpl = imageResponse([1]);
    const generate = createImageGenerator({
      fetchImpl,
      endpoint: "https://gen.test/prompt",
      width: 768,
      height: 1024,
    });
    await generate("a cat & dog");
    const [url, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://gen.test/prompt/a%20cat%20%26%20dog?width=768&height=1024&model=flux&nologo=true",
    );
    expect((init.headers as Record<string, string>)["User-Agent"]).toContain("Mosaic");
  });

  it("returns null on a non-ok response", async () => {
    const generate = createImageGenerator({ fetchImpl: imageResponse([1], "image/png", false) });
    expect(await generate("prompt")).toBeNull();
  });

  it("returns null when the response is not an image", async () => {
    const generate = createImageGenerator({ fetchImpl: imageResponse([1], "text/html") });
    expect(await generate("prompt")).toBeNull();
  });

  it("rejects a response with no content-type header", async () => {
    const fetchImpl = vi.fn(
      async () =>
        ({
          ok: true,
          headers: { get: () => null },
          arrayBuffer: async () => new Uint8Array([1]).buffer,
        }) as unknown as Response,
    );
    const generate = createImageGenerator({ fetchImpl });
    expect(await generate("prompt")).toBeNull();
  });

  it("lets a single call override the configured size", async () => {
    const fetchImpl = imageResponse([1, 2]);
    const generate = createImageGenerator({
      fetchImpl,
      endpoint: "https://gen.test/prompt",
      width: 768,
      height: 1024,
    });
    const result = await generate("a sunset", { width: 512, height: 512 });
    expect(result).toMatchObject({ width: 512, height: 512 });
    const [url] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain("width=512&height=512");
  });

  it("returns null for an empty image body", async () => {
    const generate = createImageGenerator({ fetchImpl: imageResponse([]) });
    expect(await generate("prompt")).toBeNull();
  });

  it("returns null when the request throws", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const generate = createImageGenerator({ fetchImpl });
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
    const generate = createImageGenerator({ fetchImpl, timeoutMs: 5 });
    expect(await generate("prompt")).toBeNull();
  });
});
