import { prisma } from "@/lib/prisma";

/**
 * Builds a base username candidate from an email or display name.
 *
 * @param email - The user's email, if any.
 * @param name - The user's display name, if any.
 * @returns A sanitized base handle, never empty.
 */
function baseHandle(email: string | null, name: string | null): string {
  const source = email !== null ? email.split("@")[0] : name;
  const slug = (source ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return slug.slice(0, 20) === "" ? "user" : slug.slice(0, 20);
}

/**
 * Ensures a user has a unique username, generating one from their email or name
 * when missing. Used for OAuth accounts created without a handle. Idempotent:
 * does nothing when a username already exists.
 *
 * @param userId - The user id.
 * @returns A promise that resolves when the user has a username.
 */
export async function ensureUsername(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, email: true, name: true },
  });
  if (user === null || user.username !== null) {
    return;
  }

  const base = baseHandle(user.email, user.name);
  let candidate = base;
  let suffix = 0;
  while (true) {
    const taken = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (taken === null) {
      break;
    }
    suffix += 1;
    candidate = `${base}${suffix}`;
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { username: candidate } });
  } catch {
    await prisma.user.update({ where: { id: userId }, data: { username: `${base}${Date.now()}` } });
  }
}
