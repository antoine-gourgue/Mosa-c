import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/password", () => ({ hashPassword: vi.fn(async () => "newhash") }));
vi.mock("@/lib/email", () => ({
  sendEmailChangeEmail: vi.fn(async () => true),
  sendPasswordResetEmail: vi.fn(async () => true),
}));
vi.mock("@/server/services/account-token", () => ({
  issueAccountToken: vi.fn(async () => "tok"),
  consumeAccountToken: vi.fn(),
  isAccountTokenOnCooldown: vi.fn(async () => false),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    session: { deleteMany: vi.fn() },
  },
  isUniqueConstraintError: (error: unknown) =>
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002",
}));

import { getCurrentUser } from "@/lib/auth";
import { sendEmailChangeEmail, sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  consumeAccountToken,
  isAccountTokenOnCooldown,
  issueAccountToken,
} from "@/server/services/account-token";
import {
  confirmEmailChange,
  getAccountStatus,
  requestEmailChange,
  requestPasswordReset,
  requestPasswordResetForEmail,
  resetPassword,
} from "./account";

const db = prisma as unknown as {
  user: { findFirst: Mock; findUnique: Mock; update: Mock };
  session: { deleteMany: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
  vi.mocked(isAccountTokenOnCooldown).mockResolvedValue(false);
  db.user.update.mockResolvedValue({});
  db.session.deleteMany.mockResolvedValue({ count: 0 });
});

describe("requestEmailChange", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await requestEmailChange("new@x.com")).ok).toBe(false);
  });

  it("rejects an invalid email", async () => {
    expect((await requestEmailChange("nope")).ok).toBe(false);
  });

  it("rejects an email already used by someone else", async () => {
    db.user.findFirst.mockResolvedValue({ id: "other" });
    expect(await requestEmailChange("taken@x.com")).toMatchObject({ ok: false });
    expect(issueAccountToken).not.toHaveBeenCalled();
  });

  it("emails a confirmation link to the new address", async () => {
    db.user.findFirst.mockResolvedValue(null);
    expect(await requestEmailChange("New@X.com")).toEqual({ ok: true });
    expect(issueAccountToken).toHaveBeenCalledWith("u1", "EMAIL_CHANGE", "new@x.com");
    expect(sendEmailChangeEmail).toHaveBeenCalledWith("new@x.com", expect.stringContaining("tok"));
  });

  it("reports failure when the confirmation email cannot be sent", async () => {
    db.user.findFirst.mockResolvedValue(null);
    vi.mocked(sendEmailChangeEmail).mockResolvedValueOnce(false);
    expect((await requestEmailChange("new@x.com")).ok).toBe(false);
  });

  it("throttles repeat requests within the cooldown", async () => {
    db.user.findFirst.mockResolvedValue(null);
    vi.mocked(isAccountTokenOnCooldown).mockResolvedValue(true);
    expect((await requestEmailChange("new@x.com")).ok).toBe(false);
    expect(issueAccountToken).not.toHaveBeenCalled();
  });
});

describe("confirmEmailChange", () => {
  it("rejects an invalid token", async () => {
    vi.mocked(consumeAccountToken).mockResolvedValue(null);
    expect((await confirmEmailChange("tok")).ok).toBe(false);
  });

  it("rejects when the email got taken in the meantime", async () => {
    vi.mocked(consumeAccountToken).mockResolvedValue({ userId: "u1", newEmail: "new@x.com" });
    db.user.findFirst.mockResolvedValue({ id: "other" });
    expect((await confirmEmailChange("tok")).ok).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("applies the new email and marks it verified", async () => {
    vi.mocked(consumeAccountToken).mockResolvedValue({ userId: "u1", newEmail: "new@x.com" });
    db.user.findFirst.mockResolvedValue(null);
    expect(await confirmEmailChange("tok")).toEqual({ ok: true });
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({ email: "new@x.com" }),
      }),
    );
  });

  it("reports a conflict when the email is taken at write time", async () => {
    vi.mocked(consumeAccountToken).mockResolvedValue({ userId: "u1", newEmail: "new@x.com" });
    db.user.findFirst.mockResolvedValue(null);
    db.user.update.mockRejectedValue(Object.assign(new Error("conflict"), { code: "P2002" }));
    expect((await confirmEmailChange("tok")).ok).toBe(false);
  });
});

describe("requestPasswordReset", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await requestPasswordReset()).ok).toBe(false);
  });

  it("rejects an account without a password", async () => {
    db.user.findUnique.mockResolvedValue({ email: "a@x.com", passwordHash: null });
    expect((await requestPasswordReset()).ok).toBe(false);
  });

  it("emails a reset link to the current address", async () => {
    db.user.findUnique.mockResolvedValue({ email: "a@x.com", passwordHash: "h" });
    expect(await requestPasswordReset()).toEqual({ ok: true });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith("a@x.com", expect.stringContaining("tok"));
  });

  it("reports failure when the reset email cannot be sent", async () => {
    db.user.findUnique.mockResolvedValue({ email: "a@x.com", passwordHash: "h" });
    vi.mocked(sendPasswordResetEmail).mockResolvedValueOnce(false);
    expect((await requestPasswordReset()).ok).toBe(false);
  });

  it("throttles repeat requests within the cooldown", async () => {
    db.user.findUnique.mockResolvedValue({ email: "a@x.com", passwordHash: "h" });
    vi.mocked(isAccountTokenOnCooldown).mockResolvedValue(true);
    expect((await requestPasswordReset()).ok).toBe(false);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe("requestPasswordResetForEmail", () => {
  it("reports success without sending for an unknown email", async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect(await requestPasswordResetForEmail("ghost@x.com")).toEqual({ ok: true });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("sends to an existing account with a password", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u9", email: "a@x.com", passwordHash: "h" });
    await requestPasswordResetForEmail("a@x.com");
    expect(sendPasswordResetEmail).toHaveBeenCalled();
  });

  it("silently skips sending (still ok) when on cooldown", async () => {
    db.user.findUnique.mockResolvedValue({ id: "u9", email: "a@x.com", passwordHash: "h" });
    vi.mocked(isAccountTokenOnCooldown).mockResolvedValue(true);
    expect(await requestPasswordResetForEmail("a@x.com")).toEqual({ ok: true });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("reports success and skips an invalid email", async () => {
    expect(await requestPasswordResetForEmail("nope")).toEqual({ ok: true });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe("getAccountStatus", () => {
  it("returns not-ok when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await getAccountStatus()).toEqual({ ok: false });
  });

  it("returns the email and its verified state", async () => {
    db.user.findUnique.mockResolvedValue({ email: "a@x.com", emailVerified: new Date() });
    expect(await getAccountStatus()).toEqual({ ok: true, email: "a@x.com", emailVerified: true });
    db.user.findUnique.mockResolvedValue({ email: "a@x.com", emailVerified: null });
    expect(await getAccountStatus()).toMatchObject({ emailVerified: false });
  });
});

describe("resetPassword", () => {
  it("rejects a too-short password", async () => {
    expect((await resetPassword("tok", "short")).ok).toBe(false);
  });

  it("rejects an invalid token", async () => {
    vi.mocked(consumeAccountToken).mockResolvedValue(null);
    expect((await resetPassword("tok", "newpassword")).ok).toBe(false);
  });

  it("stores the new password hash and invalidates all sessions", async () => {
    vi.mocked(consumeAccountToken).mockResolvedValue({ userId: "u1", newEmail: null });
    expect(await resetPassword("tok", "newpassword")).toEqual({ ok: true });
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { passwordHash: "newhash" } }),
    );
    expect(db.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });
});
