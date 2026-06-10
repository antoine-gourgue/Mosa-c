"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorMessage } from "@/server/error-message";

/**
 * Outcome of {@link blockUser} and {@link unblockUser}: the new block state, or
 * a failure with a localized message.
 */
export type BlockResult = { ok: true; blocked: boolean } | { ok: false; error: string };

/**
 * Blocks another user on behalf of the current user. Blocking is symmetric for
 * visibility, so it also removes any follow relationship in both directions.
 * Refuses signed-out callers and self-blocks.
 *
 * @param userId - The id of the user to block.
 * @returns Whether the user is now blocked, or a failure result.
 */
export async function blockUser(userId: string): Promise<BlockResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  if (user.id === userId) {
    return { ok: false, error: await errorMessage("cannotBlockSelf") };
  }
  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: userId } },
      update: {},
      create: { blockerId: user.id, blockedId: userId },
    }),
    prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: user.id, creatorId: userId },
          { followerId: userId, creatorId: user.id },
        ],
      },
    }),
  ]);
  revalidatePath("/");
  return { ok: true, blocked: true };
}

/**
 * Removes the current user's block on another user.
 *
 * @param userId - The id of the user to unblock.
 * @returns Whether the user is now blocked (always false), or a failure result.
 */
export async function unblockUser(userId: string): Promise<BlockResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId: userId } });
  revalidatePath("/");
  return { ok: true, blocked: false };
}
