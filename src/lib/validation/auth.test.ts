import { describe, expect, it } from "vitest";
import { registerSchema, signInSchema } from "./auth";

describe("signInSchema", () => {
  it("accepts a valid email and password", () => {
    expect(signInSchema.safeParse({ email: "a@b.com", password: "password123" }).success).toBe(
      true,
    );
  });

  it("rejects a short password", () => {
    expect(signInSchema.safeParse({ email: "a@b.com", password: "short" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signInSchema.safeParse({ email: "nope", password: "password123" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("coerces the age and accepts valid input", () => {
    const result = registerSchema.safeParse({
      email: "a@b.com",
      password: "password123",
      age: "20",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(20);
    }
  });

  it("rejects an age below 13", () => {
    expect(
      registerSchema.safeParse({ email: "a@b.com", password: "password123", age: 10 }).success,
    ).toBe(false);
  });
});
