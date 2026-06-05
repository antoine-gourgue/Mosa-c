import { prisma } from "@/lib/prisma";

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
