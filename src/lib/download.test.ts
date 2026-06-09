import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadPin, pinFilename } from "./download";

describe("pinFilename", () => {
  it("slugifies the title and keeps the source extension", () => {
    expect(pinFilename("Sunset over the Bay", "/images/a.png")).toBe("sunset-over-the-bay.png");
  });

  it("ignores query strings when reading the extension", () => {
    expect(pinFilename("Pin", "/uploads/x.webp?v=2")).toBe("pin.webp");
  });

  it("defaults the extension to jpg when the URL has none", () => {
    expect(pinFilename("Pin", "/uploads/x")).toBe("pin.jpg");
  });

  it("falls back to 'pin' when the title has no usable characters", () => {
    expect(pinFilename("!!!", "/images/a.jpg")).toBe("pin.jpg");
  });
});

describe("downloadPin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("fetches the image and triggers a named download via an anchor", async () => {
    const blob = new Blob(["data"], { type: "image/png" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) } as unknown as Response),
    );
    const createObjectURL = vi.fn().mockReturnValue("blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    await downloadPin({ url: "/images/sunset.png", title: "Sunset" });

    expect(fetch).toHaveBeenCalledWith("/images/sunset.png");
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    expect(document.querySelector("a")).toBeNull();
  });
});
