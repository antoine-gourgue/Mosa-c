import { afterEach, describe, expect, it, vi } from "vitest";
import { pinUrl, sharePin } from "./share";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sharePin", () => {
  it("uses the Web Share API when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });

    const result = await sharePin({ url: "https://m.app/pin/1", title: "Pin" });

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "Pin", url: "https://m.app/pin/1" });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("treats a cancelled native share as shared", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"));
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });

    const result = await sharePin({ url: "https://m.app/pin/1", title: "Pin" });

    expect(result).toBe("shared");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the URL to the clipboard when sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = await sharePin({ url: "https://m.app/pin/1", title: "Pin" });

    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://m.app/pin/1");
  });
});

describe("pinUrl", () => {
  it("builds an absolute URL from the window origin", () => {
    vi.stubGlobal("window", { location: { origin: "https://m.app" } });
    expect(pinUrl("abc")).toBe("https://m.app/pin/abc");
  });
});
