import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("collapses runs of non-alphanumerics into one hyphen", () => {
    expect(slugify("a  --  b!!c")).toBe("a-b-c");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  !Art & Design!  ")).toBe("art-design");
  });

  it("keeps digits", () => {
    expect(slugify("Top 10 Picks")).toBe("top-10-picks");
  });

  it("returns an empty string when nothing is alphanumeric", () => {
    expect(slugify("!!! ---")).toBe("");
  });
});
