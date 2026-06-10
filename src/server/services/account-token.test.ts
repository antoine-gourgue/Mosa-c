import { createHash } from "node:crypto";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accountToken: { deleteMany: vi.fn(), upsert: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  ACCOUNT_TOKEN_COOLDOWN_MS,
  ACCOUNT_TOKEN_TTL_MS,
  consumeAccountToken,
  generateToken,
  hashToken,
  isAccountTokenOnCooldown,
  issueAccountToken,
} from "./account-token";

const db = prisma as unknown as {
  accountToken: { deleteMany: Mock; upsert: Mock; findUnique: Mock };
};

const sha = (s: string): string => createHash("sha256").update(s).digest("hex");

beforeEach(() => {
  vi.clearAllMocks();
  db.accountToken.deleteMany.mockResolvedValue({ count: 0 });
  db.accountToken.upsert.mockResolvedValue({});
});

describe("generateToken / hashToken", () => {
  it("generates a 64-char hex token", () => {
    expect(generateToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes deterministically with SHA-256", () => {
    expect(hashToken("abc")).toBe(sha("abc"));
  });
});

describe("issueAccountToken", () => {
  it("atomically replaces any existing token of the kind and stores the hash", async () => {
    const token = await issueAccountToken("u1", "PASSWORD_RESET");
    const args = db.accountToken.upsert.mock.calls[0]?.[0];
    expect(args.where).toEqual({ userId_kind: { userId: "u1", kind: "PASSWORD_RESET" } });
    expect(args.create.tokenHash).toBe(hashToken(token));
    expect(args.create.kind).toBe("PASSWORD_RESET");
    expect(args.update.tokenHash).toBe(hashToken(token));
  });

  it("stores the pending email for an email change", async () => {
    await issueAccountToken("u1", "EMAIL_CHANGE", "new@x.com");
    expect(db.accountToken.upsert.mock.calls[0]?.[0].create.newEmail).toBe("new@x.com");
  });
});

describe("isAccountTokenOnCooldown", () => {
  it("returns false when no token exists", async () => {
    db.accountToken.findUnique.mockResolvedValue(null);
    expect(await isAccountTokenOnCooldown("u1", "PASSWORD_RESET")).toBe(false);
  });

  it("returns true for a token issued within the cooldown", async () => {
    db.accountToken.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + ACCOUNT_TOKEN_TTL_MS),
    });
    expect(await isAccountTokenOnCooldown("u1", "PASSWORD_RESET")).toBe(true);
  });

  it("returns false for a token issued before the cooldown", async () => {
    db.accountToken.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + ACCOUNT_TOKEN_TTL_MS - 2 * ACCOUNT_TOKEN_COOLDOWN_MS),
    });
    expect(await isAccountTokenOnCooldown("u1", "PASSWORD_RESET")).toBe(false);
  });
});

describe("consumeAccountToken", () => {
  it("returns null for an unknown token", async () => {
    db.accountToken.findUnique.mockResolvedValue(null);
    expect(await consumeAccountToken("tok", "PASSWORD_RESET")).toBeNull();
  });

  it("returns null (and keeps it) on a kind mismatch", async () => {
    db.accountToken.findUnique.mockResolvedValue({
      id: "t1",
      kind: "EMAIL_CHANGE",
      userId: "u1",
      newEmail: "x@x.com",
      expiresAt: new Date(Date.now() + 10000),
    });
    expect(await consumeAccountToken("tok", "PASSWORD_RESET")).toBeNull();
    expect(db.accountToken.deleteMany).not.toHaveBeenCalled();
  });

  it("consumes a valid token and returns its payload", async () => {
    db.accountToken.findUnique.mockResolvedValue({
      id: "t1",
      kind: "EMAIL_CHANGE",
      userId: "u1",
      newEmail: "new@x.com",
      expiresAt: new Date(Date.now() + 10000),
    });
    db.accountToken.deleteMany.mockResolvedValue({ count: 1 });
    expect(await consumeAccountToken("tok", "EMAIL_CHANGE")).toEqual({
      userId: "u1",
      newEmail: "new@x.com",
    });
    expect(db.accountToken.deleteMany).toHaveBeenCalledWith({ where: { id: "t1" } });
  });

  it("returns null when a racing request already consumed the token", async () => {
    db.accountToken.findUnique.mockResolvedValue({
      id: "t1",
      kind: "EMAIL_CHANGE",
      userId: "u1",
      newEmail: "new@x.com",
      expiresAt: new Date(Date.now() + 10000),
    });
    db.accountToken.deleteMany.mockResolvedValue({ count: 0 });
    expect(await consumeAccountToken("tok", "EMAIL_CHANGE")).toBeNull();
  });

  it("rejects (and clears) an expired token", async () => {
    db.accountToken.findUnique.mockResolvedValue({
      id: "t1",
      kind: "PASSWORD_RESET",
      userId: "u1",
      newEmail: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    db.accountToken.deleteMany.mockResolvedValue({ count: 1 });
    expect(await consumeAccountToken("tok", "PASSWORD_RESET")).toBeNull();
    expect(db.accountToken.deleteMany).toHaveBeenCalled();
  });
});
