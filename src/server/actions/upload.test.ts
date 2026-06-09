import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));

import { getCurrentUser } from "@/lib/auth";
import { importImageFromUrl } from "./upload";

const headers = (entries: Record<string, string>) => ({
  get: (key: string) => entries[key.toLowerCase()] ?? null,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("importImageFromUrl", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await importImageFromUrl("https://x.com/a.png")).toMatchObject({ ok: false });
  });

  it("rejects an invalid URL", async () => {
    expect(await importImageFromUrl("not a url")).toEqual({
      ok: false,
      error: "Enter a valid URL.",
    });
  });

  it("rejects non-http protocols", async () => {
    const result = await importImageFromUrl("ftp://x.com/a.png");
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/http/) });
  });

  it("blocks private/loopback hosts", async () => {
    expect(await importImageFromUrl("http://127.0.0.1/a.png")).toMatchObject({ ok: false });
    expect(await importImageFromUrl("http://192.168.1.5/a.png")).toMatchObject({ ok: false });
    expect(await importImageFromUrl("http://localhost/a.png")).toMatchObject({ ok: false });
  });

  it("rejects a non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await importImageFromUrl("https://x.com/a.png")).toMatchObject({ ok: false });
  });

  it("rejects a non-image content type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, headers: headers({ "content-type": "text/html" }) }),
    );
    const result = await importImageFromUrl("https://x.com/a");
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/image/) });
  });

  it("rejects an oversized declared length", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: headers({
          "content-type": "image/png",
          "content-length": String(20 * 1024 * 1024),
        }),
      }),
    );
    expect(await importImageFromUrl("https://x.com/a.png")).toMatchObject({ ok: false });
  });

  it("returns a data URL and derived name on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: headers({ "content-type": "image/png" }),
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode("img").buffer),
      }),
    );
    const result = await importImageFromUrl("https://x.com/path/photo.png");
    expect(result).toMatchObject({ ok: true, name: "photo.png" });
    if (result.ok) {
      expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
    }
  });

  it("returns an error when the fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await importImageFromUrl("https://x.com/a.png")).toMatchObject({ ok: false });
  });
});
