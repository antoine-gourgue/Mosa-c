import { prisma } from "@/lib/prisma";
import { ensureUsername } from "./username";

/**
 * Ensures a user has a default "Quick Saves" board. OAuth accounts are created
 * by the adapter without one. Idempotent.
 *
 * @param userId - The user id.
 * @returns A promise that resolves when a default board exists.
 */
async function ensureDefaultBoard(userId: string): Promise<void> {
  const existing = await prisma.board.findFirst({
    where: { ownerId: userId, isDefault: true },
    select: { id: true },
  });
  if (existing !== null) {
    return;
  }
  await prisma.board.create({ data: { ownerId: userId, name: "Quick Saves", isDefault: true } });
}

/**
 * Ensures an account is fully set up: a unique username and a default board.
 * Runs on sign-in so OAuth accounts, which skip registration, are completed.
 *
 * @param userId - The user id.
 * @returns A promise that resolves when setup is complete.
 */
export async function ensureUserSetup(userId: string): Promise<void> {
  await ensureUsername(userId);
  await ensureDefaultBoard(userId);
}
