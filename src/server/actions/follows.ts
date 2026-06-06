"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/server/notifications";
import { AppError } from "@/server/result";

/**
 * Toggles whether the current user follows a creator, creating or deleting the
 * Follow row. The composite primary key prevents duplicates.
 *
 * @param creatorId - The id of the creator to follow or unfollow.
 * @returns The new following state.
 */
export async function toggleFollow(creatorId: string): Promise<{ following: boolean }> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to follow creators.");
  }
  if (user.id === creatorId) {
    throw new AppError("VALIDATION", "You cannot follow yourself.");
  }

  const key = { followerId_creatorId: { followerId: user.id, creatorId } };
  const existing = await prisma.follow.findUnique({ where: key });

  if (existing === null) {
    await prisma.follow.create({ data: { followerId: user.id, creatorId } });
    await createNotification({ type: "FOLLOW", recipientId: creatorId, actorId: user.id });
  } else {
    await prisma.follow.delete({ where: key });
  }

  return { following: existing === null };
}
