"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/server/notifications";
import { AppError } from "@/server/result";
import type { FollowState } from "@/types/domain";

/**
 * Advances the current user's relationship with a creator by one step, returning
 * the resulting state. The transitions are:
 *
 * - not following a public creator → follow them (and notify them);
 * - not following a private creator → send a follow request (awaiting approval);
 * - a pending request → cancel it;
 * - already following → unfollow.
 *
 * @param creatorId - The id of the creator to act on.
 * @returns The new follow state.
 */
export async function toggleFollow(creatorId: string): Promise<{ status: FollowState }> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to follow creators.");
  }
  if (user.id === creatorId) {
    throw new AppError("VALIDATION", "You cannot follow yourself.");
  }

  const followKey = { followerId_creatorId: { followerId: user.id, creatorId } };
  const requestKey = { requesterId_targetId: { requesterId: user.id, targetId: creatorId } };
  const [existingFollow, existingRequest] = await Promise.all([
    prisma.follow.findUnique({ where: followKey, select: { followerId: true } }),
    prisma.followRequest.findUnique({ where: requestKey, select: { requesterId: true } }),
  ]);

  if (existingFollow !== null) {
    await prisma.follow.delete({ where: followKey });
    return { status: "none" };
  }
  if (existingRequest !== null) {
    await prisma.followRequest.delete({ where: requestKey });
    return { status: "none" };
  }

  const target = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { isPrivate: true },
  });
  if (target === null) {
    throw new AppError("NOT_FOUND", "That creator no longer exists.");
  }

  if (target.isPrivate) {
    await prisma.followRequest.create({ data: { requesterId: user.id, targetId: creatorId } });
    return { status: "requested" };
  }

  await prisma.follow.create({ data: { followerId: user.id, creatorId } });
  await createNotification({ type: "FOLLOW", recipientId: creatorId, actorId: user.id });
  return { status: "following" };
}

/**
 * Approves a pending follow request: the requester starts following the current
 * user and the request is cleared. No-ops when the request no longer exists.
 *
 * @param requesterId - The id of the user whose request is being approved.
 */
export async function acceptFollowRequest(requesterId: string): Promise<void> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to manage follow requests.");
  }
  const requestKey = { requesterId_targetId: { requesterId, targetId: user.id } };
  const request = await prisma.followRequest.findUnique({
    where: requestKey,
    select: { requesterId: true },
  });
  if (request === null) {
    return;
  }
  await prisma.$transaction([
    prisma.follow.createMany({
      data: [{ followerId: requesterId, creatorId: user.id }],
      skipDuplicates: true,
    }),
    prisma.followRequest.delete({ where: requestKey }),
  ]);
}

/**
 * Declines a pending follow request, removing it without creating a follow.
 *
 * @param requesterId - The id of the user whose request is being declined.
 */
export async function declineFollowRequest(requesterId: string): Promise<void> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to manage follow requests.");
  }
  await prisma.followRequest.deleteMany({ where: { requesterId, targetId: user.id } });
}
