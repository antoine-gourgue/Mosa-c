import { describe, expect, it } from "vitest";
import { cosineSimilarity } from "./cosine";

describe("cosineSimilarity", () => {
  it("is 1 for identical direction", () => {
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  });

  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  it("is -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1);
  });

  it("is 0 for mismatched lengths", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it("is 0 for an empty or zero vector", () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});
