import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password with bcrypt.
 *
 * @param plain - The plaintext password.
 * @returns The bcrypt hash.
 */
export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 *
 * @param plain - The plaintext password to check.
 * @param hashed - The stored bcrypt hash.
 * @returns True when the password matches.
 */
export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}
