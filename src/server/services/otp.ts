import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * How long a verification code stays valid.
 */
export const OTP_TTL_MS = 10 * 60 * 1000;

/**
 * How many wrong attempts are allowed before a code is invalidated.
 */
export const OTP_MAX_ATTEMPTS = 5;

/**
 * Generates a random 6-digit numeric verification code, zero-padded.
 *
 * @returns The 6-digit code as a string.
 */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Hashes a code for storage and comparison. Codes are never stored in clear.
 *
 * @param code - The plaintext code.
 * @returns The hex SHA-256 hash.
 */
export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * Constant-time comparison of two hex hashes of equal length.
 *
 * @param a - The first hex hash.
 * @param b - The second hex hash.
 * @returns True when the hashes are identical.
 */
function hashesEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Issues a fresh verification code for an email, replacing any existing one and
 * resetting its expiry and attempt counter.
 *
 * @param email - The email address to verify.
 * @returns The plaintext code, to be emailed to the user.
 */
export async function issueOtp(email: string): Promise<string> {
  const code = generateOtpCode();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.emailOtp.upsert({
    where: { email },
    update: { codeHash, expiresAt, attempts: 0 },
    create: { email, codeHash, expiresAt },
  });
  return code;
}

/**
 * The outcome of checking a submitted code.
 */
export type OtpCheck =
  | { ok: true }
  | { ok: false; reason: "missing" | "expired" | "locked" | "invalid" };

/**
 * Verifies a submitted code against the stored one, enforcing expiry and an
 * attempt limit. A correct code consumes (deletes) the stored record; a wrong
 * code increments the attempt counter; an expired or exhausted code is removed.
 *
 * @param email - The email being verified.
 * @param code - The submitted code.
 * @returns Whether the code is valid, with a reason on failure.
 */
export async function checkOtp(email: string, code: string): Promise<OtpCheck> {
  const record = await prisma.emailOtp.findUnique({ where: { email } });
  if (record === null) {
    return { ok: false, reason: "missing" };
  }
  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.delete({ where: { email } }).catch(() => undefined);
    return { ok: false, reason: "expired" };
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.emailOtp.delete({ where: { email } }).catch(() => undefined);
    return { ok: false, reason: "locked" };
  }
  if (!hashesEqual(record.codeHash, hashOtp(code))) {
    await prisma.emailOtp.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "invalid" };
  }
  await prisma.emailOtp.delete({ where: { email } }).catch(() => undefined);
  return { ok: true };
}
