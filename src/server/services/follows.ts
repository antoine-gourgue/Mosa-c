import { prisma } from "@/lib/prisma";
import type { Creator, FollowState } from "@/types/domain";
import { toCreator } from "./mappers";

/**
 * Fetches the ids of creators followed by a user.
 *
 * @param userId - The follower's user id.
 * @returns The followed creator ids.
 */
export async function getFollowedCreatorIds(userId: string): Promise<string[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { creatorId: true },
  });
  return rows.map((row) => row.creatorId);
}

/**
 * Checks whether a user follows a creator.
 *
 * @param userId - The follower's user id.
 * @param creatorId - The creator's user id.
 * @returns True when the user follows the creator.
 */
export async function isFollowing(userId: string, creatorId: string): Promise<boolean> {
  const row = await prisma.follow.findUnique({
    where: { followerId_creatorId: { followerId: userId, creatorId } },
  });
  return row !== null;
}

/**
 * Resolves a viewer's follow relationship with a creator, distinguishing a
 * pending follow request (sent to a private account) from an active follow.
 *
 * @param userId - The viewer's user id.
 * @param creatorId - The creator's user id.
 * @returns The follow state.
 */
export async function getFollowState(userId: string, creatorId: string): Promise<FollowState> {
  const [follow, request] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_creatorId: { followerId: userId, creatorId } },
      select: { followerId: true },
    }),
    prisma.followRequest.findUnique({
      where: { requesterId_targetId: { requesterId: userId, targetId: creatorId } },
      select: { requesterId: true },
    }),
  ]);
  if (follow !== null) {
    return "following";
  }
  if (request !== null) {
    return "requested";
  }
  return "none";
}

/**
 * Fetches the creators waiting on the user to approve their follow request,
 * newest first. Used to populate the follow-requests inbox of a private account.
 *
 * @param userId - The targeted user's id.
 * @returns The requesters as creators.
 */
export async function getPendingFollowRequests(userId: string): Promise<Creator[]> {
  const rows = await prisma.followRequest.findMany({
    where: { targetId: userId },
    include: { requester: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => toCreator(row.requester));
}

/**
 * Counts the follow requests awaiting the user's approval.
 *
 * @param userId - The targeted user's id.
 * @returns The number of pending requests.
 */
export async function getPendingFollowRequestCount(userId: string): Promise<number> {
  return prisma.followRequest.count({ where: { targetId: userId } });
}
