import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * How long an account action token (email change, password reset) stays valid.
 */
export const ACCOUNT_TOKEN_TTL_MS = 30 * 60 * 1000;

/**
 * Minimum delay between two issuances of the same token kind for a user, to
 * throttle confirmation/reset emails and prevent inbox flooding.
 */
export const ACCOUNT_TOKEN_COOLDOWN_MS = 60 * 1000;

/**
 * The kinds of account action a token authorises.
 */
export type AccountTokenKind = "EMAIL_CHANGE" | "PASSWORD_RESET";

/**
 * Generates a high-entropy, URL-safe token to embed in an email link.
 *
 * @returns The plaintext token.
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hashes a token for storage and lookup; tokens are never stored in clear.
 *
 * @param token - The plaintext token.
 * @returns The hex SHA-256 hash.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Whether a token of the given kind was issued for the user within the cooldown
 * window, used to throttle repeat email sends. The last issuance time is derived
 * from the active token's expiry (issued at `expiresAt - TTL`).
 *
 * @param userId - The user to check.
 * @param kind - The action kind to check.
 * @returns True when another token was issued less than the cooldown ago.
 */
export async function isAccountTokenOnCooldown(
  userId: string,
  kind: AccountTokenKind,
): Promise<boolean> {
  const existing = await prisma.accountToken.findUnique({
    where: { userId_kind: { userId, kind } },
    select: { expiresAt: true },
  });
  if (existing === null) {
    return false;
  }
  const issuedAt = existing.expiresAt.getTime() - ACCOUNT_TOKEN_TTL_MS;
  return Date.now() - issuedAt < ACCOUNT_TOKEN_COOLDOWN_MS;
}

/**
 * Issues a single-use token for an account action, atomically replacing any
 * existing token of the same kind for the user. The `(userId, kind)` unique
 * constraint and upsert guarantee a single active token survives even under
 * concurrent requests.
 *
 * @param userId - The user the token belongs to.
 * @param kind - The action the token authorises.
 * @param newEmail - The pending new email, for an email change.
 * @returns The plaintext token to put in the email link.
 */
export async function issueAccountToken(
  userId: string,
  kind: AccountTokenKind,
  newEmail: string | null = null,
): Promise<string> {
  const token = generateToken();
  const data = {
    newEmail,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ACCOUNT_TOKEN_TTL_MS),
  };
  await prisma.accountToken.upsert({
    where: { userId_kind: { userId, kind } },
    create: { userId, kind, ...data },
    update: data,
  });
  return token;
}

/**
 * Validates and consumes a token: it is deleted on use (single-use) and only
 * returned when it matches the expected kind and has not expired.
 *
 * @param token - The plaintext token from the link.
 * @param kind - The expected action kind.
 * @returns The token's user and pending email, or null when invalid/expired.
 */
export async function consumeAccountToken(
  token: string,
  kind: AccountTokenKind,
): Promise<{ userId: string; newEmail: string | null } | null> {
  const record = await prisma.accountToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (record === null || record.kind !== kind) {
    return null;
  }
  const { count } = await prisma.accountToken.deleteMany({ where: { id: record.id } });
  if (count === 0 || record.expiresAt.getTime() < Date.now()) {
    return null;
  }
  return { userId: record.userId, newEmail: record.newEmail };
}
