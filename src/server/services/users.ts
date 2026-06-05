import { prisma } from "@/lib/prisma";
import type { Creator } from "@/types/domain";
import { toCreator } from "./mappers";

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
  const rows = await prisma.user.findMany({
    where: { id: { not: excludeId }, verified: true },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toCreator);
}
