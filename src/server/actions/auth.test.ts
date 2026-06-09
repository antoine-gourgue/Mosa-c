import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    emailOtp: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn(async () => "hashed"),
  verifyPassword: vi.fn(),
}));
vi.mock("@/lib/email", () => ({ sendOtpEmail: vi.fn(async () => true) }));
vi.mock("@/server/services/otp", () => ({
  issueOtp: vi.fn(async () => "123456"),
  OTP_TTL_MS: 600_000,
}));

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { issueOtp } from "@/server/services/otp";
import { loginUser, logout, registerUser, resendOtp, signInWithProvider, verifyOtp } from "./auth";

const db = prisma as unknown as {
  user: { findUnique: Mock; create: Mock };
  emailOtp: { findUnique: Mock };
};

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a duplicate email", async () => {
    db.user.findUnique.mockResolvedValue({ id: "existing" });
    const result = await registerUser({
      username: "ada",
      email: "a@b.com",
      password: "password123",
      age: 20,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.email).toBeTruthy();
    }
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("rejects a taken username when the email is free", async () => {
    db.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "taken" });
    const result = await registerUser({
      username: "ada",
      email: "free@b.com",
      password: "password123",
      age: 20,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.username).toBeTruthy();
    }
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("creates the user with a default Quick Saves board on success", async () => {
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: "new" });
    await registerUser({
      username: "ada",
      email: "a@b.com",
      password: "password123",
      age: 20,
      gender: "FEMALE",
    });
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
    const result = await registerUser({ username: "ab", email: "nope", password: "short", age: 5 });
    expect(result.ok).toBe(false);
  });
});

describe("loginUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.user.findUnique.mockResolvedValue(null);
  });

  it("returns field errors for invalid credentials shape", async () => {
    const result = await loginUser({ email: "nope", password: "short" });
    expect(result.ok).toBe(false);
  });

  it("signs in on valid credentials", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined as never);
    expect(await loginUser({ email: "a@b.com", password: "password123" })).toEqual({ ok: true });
  });

  it("routes an unverified account to verification with a fresh code", async () => {
    db.user.findUnique.mockResolvedValue({
      passwordHash: "hashed",
      disabled: false,
      emailVerified: null,
    });
    vi.mocked(verifyPassword).mockResolvedValue(true);
    const result = await loginUser({ email: "a@b.com", password: "password123" });
    expect(result).toMatchObject({ ok: false, needsVerification: true, email: "a@b.com" });
    expect(issueOtp).toHaveBeenCalledWith("a@b.com");
    expect(sendOtpEmail).toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
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

describe("registerUser (verification)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.user.findUnique.mockResolvedValue(null);
    db.user.create.mockResolvedValue({ id: "new" });
  });

  it("creates an unverified account and emails a code", async () => {
    const result = await registerUser({
      username: "ada",
      email: "a@b.com",
      password: "password123",
      age: 20,
    });
    expect(result).toMatchObject({ ok: false, needsVerification: true, email: "a@b.com" });
    expect(issueOtp).toHaveBeenCalledWith("a@b.com");
    expect(sendOtpEmail).toHaveBeenCalledWith("a@b.com", "123456");
    expect(signIn).not.toHaveBeenCalled();
  });
});

describe("verifyOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs the user in on a valid code", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined as never);
    expect(await verifyOtp("a@b.com", " 123456 ")).toEqual({ ok: true });
    expect(signIn).toHaveBeenCalledWith(
      "email-otp",
      expect.objectContaining({ email: "a@b.com", code: "123456" }),
    );
  });

  it("maps an AuthError to a friendly message", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError("bad"));
    expect(await verifyOtp("a@b.com", "000000")).toMatchObject({ ok: false });
  });

  it("rethrows non-auth errors (the success redirect)", async () => {
    vi.mocked(signIn).mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(verifyOtp("a@b.com", "123456")).rejects.toThrow();
  });
});

describe("resendOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does nothing for an unknown or already-verified account", async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect(await resendOtp("a@b.com")).toEqual({ ok: true });
    db.user.findUnique.mockResolvedValue({ emailVerified: new Date() });
    expect(await resendOtp("a@b.com")).toEqual({ ok: true });
    expect(issueOtp).not.toHaveBeenCalled();
  });

  it("re-issues a code when none is pending", async () => {
    db.user.findUnique.mockResolvedValue({ emailVerified: null });
    db.emailOtp.findUnique.mockResolvedValue(null);
    await resendOtp("a@b.com");
    expect(issueOtp).toHaveBeenCalledWith("a@b.com");
  });

  it("throttles a code issued moments ago", async () => {
    db.user.findUnique.mockResolvedValue({ emailVerified: null });
    db.emailOtp.findUnique.mockResolvedValue({ expiresAt: new Date(Date.now() + 600_000) });
    await resendOtp("a@b.com");
    expect(issueOtp).not.toHaveBeenCalled();
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
