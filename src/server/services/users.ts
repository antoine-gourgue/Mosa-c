import { prisma } from "@/lib/prisma";
import type { Creator, MentionSuggestion } from "@/types/domain";
import { getHiddenUserIds } from "./blocks";
import { toCreator } from "./mappers";

/**
 * Searches users with a public username for an @mention autocomplete, matching
 * the query against the username or display name. Users without a username are
 * excluded since they cannot be mentioned.
 *
 * @param query - The partial handle or name typed after the "@".
 * @param excludeId - A user id to exclude (typically the current user).
 * @param limit - The maximum number of suggestions to return.
 * @returns The matching mention suggestions, verified users first.
 */
export async function searchMentionUsers(
  query: string,
  excludeId: string | null,
  limit = 6,
): Promise<MentionSuggestion[]> {
  const trimmed = query.trim();
  const hidden = await getHiddenUserIds(excludeId);
  const idFilter = {
    ...(excludeId === null ? {} : { not: excludeId }),
    ...(hidden.length > 0 ? { notIn: hidden } : {}),
  };
  const rows = await prisma.user.findMany({
    where: {
      username: { not: null },
      ...(Object.keys(idFilter).length > 0 ? { id: idFilter } : {}),
      ...(trimmed === ""
        ? {}
        : {
            OR: [
              { username: { contains: trimmed, mode: "insensitive" as const } },
              { name: { contains: trimmed, mode: "insensitive" as const } },
            ],
          }),
    },
    select: { id: true, name: true, username: true, avatarUrl: true },
    orderBy: [{ verified: "desc" }, { username: "asc" }],
    take: limit,
  });
  return rows
    .filter((row): row is typeof row & { username: string } => row.username !== null)
    .map((row) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      avatarUrl: row.avatarUrl,
    }));
}

/**
 * Searches linkable accounts (those with a public username) for the search
 * "Accounts" tab, matching the query against the username or display name.
 * Blocked users and the viewer are excluded; verified accounts rank first.
 *
 * @param query - The search query.
 * @param viewerId - The current viewer id, or null when signed out.
 * @param limit - The maximum number of accounts to return.
 * @returns The matching creators, or an empty list for a blank query.
 */
export async function searchUsers(
  query: string,
  viewerId: string | null = null,
  limit = 20,
): Promise<Creator[]> {
  const q = query.trim();
  if (q === "") {
    return [];
  }
  const hidden = await getHiddenUserIds(viewerId);
  const idFilter = {
    ...(viewerId === null ? {} : { not: viewerId }),
    ...(hidden.length > 0 ? { notIn: hidden } : {}),
  };
  const rows = await prisma.user.findMany({
    where: {
      username: { not: null },
      ...(Object.keys(idFilter).length > 0 ? { id: idFilter } : {}),
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ verified: "desc" }, { username: "asc" }],
    take: limit,
  });
  return rows.map(toCreator);
}

/**
 * Fetches a creator by id.
 *
 * @param id - The user id.
 * @returns The creator, or null when it does not exist.
 */
export async function getCreatorById(id: string): Promise<Creator | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row === null ? null : toCreator(row);
}

/**
 * Fetches creators other than the given user, used for suggestions.
 *
 * @param excludeId - A user id to exclude from the results.
 * @param limit - The maximum number of creators to return.
 * @returns The suggested creators.
 */
export async function getSuggestedCreators(excludeId: string, limit = 3): Promise<Creator[]> {
  const hidden = await getHiddenUserIds(excludeId);
  const rows = await prisma.user.findMany({
    where: {
      id: { not: excludeId, ...(hidden.length > 0 ? { notIn: hidden } : {}) },
      verified: true,
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toCreator);
}

/**
 * Fetches a user by their public username handle.
 *
 * @param username - The username handle.
 * @returns The creator, or null when no user has that handle.
 */
export async function getUserByUsername(username: string): Promise<Creator | null> {
  const row = await prisma.user.findUnique({ where: { username } });
  return row === null ? null : toCreator(row);
}

/**
 * Counts how many users follow a creator and how many they follow.
 *
 * @param userId - The user id.
 * @returns The followers and following counts.
 */
export async function getFollowCounts(
  userId: string,
): Promise<{ followers: number; following: number }> {
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { creatorId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
}
