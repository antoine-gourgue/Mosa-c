import { createHash } from "node:crypto";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailOtp: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { checkOtp, generateOtpCode, hashOtp, issueOtp, OTP_MAX_ATTEMPTS } from "./otp";

const db = prisma as unknown as {
  emailOtp: { findUnique: Mock; upsert: Mock; update: Mock; delete: Mock };
};

const sha = (s: string): string => createHash("sha256").update(s).digest("hex");

beforeEach(() => {
  vi.clearAllMocks();
  db.emailOtp.delete.mockResolvedValue({});
  db.emailOtp.update.mockResolvedValue({});
  db.emailOtp.upsert.mockResolvedValue({});
});

describe("generateOtpCode", () => {
  it("returns a zero-padded 6-digit string", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });
});

describe("hashOtp", () => {
  it("is a deterministic SHA-256 hash", () => {
    expect(hashOtp("123456")).toBe(sha("123456"));
    expect(hashOtp("123456")).toBe(hashOtp("123456"));
  });
});

describe("issueOtp", () => {
  it("upserts a hashed code and returns the plaintext", async () => {
    db.emailOtp.upsert.mockResolvedValue({});
    const code = await issueOtp("a@x.com");
    expect(code).toMatch(/^\d{6}$/);
    const args = db.emailOtp.upsert.mock.calls[0]?.[0];
    expect(args.where).toEqual({ email: "a@x.com" });
    expect(args.update.codeHash).toBe(sha(code));
    expect(args.update.attempts).toBe(0);
  });
});

describe("checkOtp", () => {
  it("reports a missing code", async () => {
    db.emailOtp.findUnique.mockResolvedValue(null);
    expect(await checkOtp("a@x.com", "123456")).toEqual({ ok: false, reason: "missing" });
  });

  it("expires and clears an old code", async () => {
    db.emailOtp.findUnique.mockResolvedValue({
      codeHash: sha("123456"),
      expiresAt: new Date(Date.now() - 1000),
      attempts: 0,
    });
    expect(await checkOtp("a@x.com", "123456")).toEqual({ ok: false, reason: "expired" });
    expect(db.emailOtp.delete).toHaveBeenCalled();
  });

  it("locks after too many attempts", async () => {
    db.emailOtp.findUnique.mockResolvedValue({
      codeHash: sha("123456"),
      expiresAt: new Date(Date.now() + 10000),
      attempts: OTP_MAX_ATTEMPTS,
    });
    expect(await checkOtp("a@x.com", "000000")).toEqual({ ok: false, reason: "locked" });
    expect(db.emailOtp.delete).toHaveBeenCalled();
  });

  it("counts a wrong attempt without consuming the code", async () => {
    db.emailOtp.findUnique.mockResolvedValue({
      codeHash: sha("123456"),
      expiresAt: new Date(Date.now() + 10000),
      attempts: 1,
    });
    expect(await checkOtp("a@x.com", "999999")).toEqual({ ok: false, reason: "invalid" });
    expect(db.emailOtp.update).toHaveBeenCalledWith({
      where: { email: "a@x.com" },
      data: { attempts: { increment: 1 } },
    });
  });

  it("accepts the right code and consumes it", async () => {
    db.emailOtp.findUnique.mockResolvedValue({
      codeHash: sha("123456"),
      expiresAt: new Date(Date.now() + 10000),
      attempts: 0,
    });
    expect(await checkOtp("a@x.com", "123456")).toEqual({ ok: true });
    expect(db.emailOtp.delete).toHaveBeenCalledWith({ where: { email: "a@x.com" } });
  });
});
