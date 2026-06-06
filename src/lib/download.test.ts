import { describe, expect, it } from "vitest";
import { pinFilename } from "./download";

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
