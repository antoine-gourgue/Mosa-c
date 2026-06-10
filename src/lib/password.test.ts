import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("hashes a password and verifies it", async () => {
    const hash = await hashPassword("password123");
    expect(hash).not.toBe("password123");
    expect(await verifyPassword("password123", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  }, 30_000);
});
