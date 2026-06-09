import { describe, expect, it } from "vitest";
import { AppError, fail, ok } from "./result";

describe("ok", () => {
  it("wraps a value as a successful result", () => {
    expect(ok(42)).toEqual({ ok: true, data: 42 });
  });
});

describe("fail / AppError", () => {
  it("builds a failed result carrying a typed AppError", () => {
    const result = fail("NOT_FOUND", "Missing");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toBe("Missing");
      expect(result.error.name).toBe("AppError");
    }
  });
});
