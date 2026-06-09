import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/password", () => ({ hashPassword: vi.fn(async () => "hashed") }));

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginUser, logout, registerUser, signInWithProvider } from "./auth";

const db = prisma as unknown as {
  user: { findUnique: Mock; create: Mock };
};

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a duplicate email", async () => {
    db.user.findUnique.mockResolvedValue({ id: "existing" });
    const result = await registerUser({ email: "a@b.com", password: "password123", age: 20 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.email).toBeTruthy();
    }
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("creates the user with a default Quick Saves board on success", async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: "new" });
    await registerUser({ email: "a@b.com", password: "password123", age: 20, gender: "FEMALE" });
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "a@b.com",
          gender: "FEMALE",
          boards: { create: { name: "Quick Saves", isDefault: true } },
        }),
      }),
    );
  });

  it("returns field errors for invalid input", async () => {
    const result = await registerUser({ email: "nope", password: "short", age: 5 });
    expect(result.ok).toBe(false);
  });
});

describe("loginUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns field errors for invalid credentials shape", async () => {
    const result = await loginUser({ email: "nope", password: "short" });
    expect(result.ok).toBe(false);
  });

  it("signs in on valid credentials", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined as never);
    expect(await loginUser({ email: "a@b.com", password: "password123" })).toEqual({ ok: true });
  });

  it("maps an AuthError to a form error", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError("bad"));
    const result = await loginUser({ email: "a@b.com", password: "password123" });
    expect(result).toMatchObject({ ok: false, formError: expect.any(String) });
  });

  it("rethrows non-auth errors (e.g. redirect)", async () => {
    vi.mocked(signIn).mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(loginUser({ email: "a@b.com", password: "password123" })).rejects.toThrow();
  });
});

describe("signInWithProvider / logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts an OAuth flow with the provider", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined as never);
    await signInWithProvider("google");
    expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/" });
  });

  it("signs the user out to the login page", async () => {
    await logout();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });
});
