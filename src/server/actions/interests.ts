"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { searchTags } from "@/server/services/tags";
import type { Tag } from "@/types/domain";

/**
 * Searches tags by name for the interest picker, so the user can find tags
 * beyond the popular shortlist (scales past a flat grid of every tag).
 *
 * @param query - The partial tag name.
 * @returns The matching tags (empty for a blank query).
 */
export async function searchInterestTags(query: string): Promise<Tag[]> {
  return searchTags(query, 40);
}

/**
 * The result shape shared by the interest actions.
 */
export type InterestsResult = { ok: true } | { ok: false };

/**
 * The most interests a user can pick, bounding the write and the feed signal.
 */
const MAX_INTERESTS = 50;

/**
 * Replaces the current user's interest tags with the given selection and marks
 * onboarding as complete (preserving the original completion time, so editing
 * interests later from settings does not reset it). Unknown tag ids are dropped.
 * Passing an empty selection records a skip.
 *
 * @param tagIds - The selected tag ids.
 * @returns Whether the interests were saved.
 */
export async function saveInterests(tagIds: string[]): Promise<InterestsResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false };
  }
  const unique = [...new Set(tagIds)].slice(0, MAX_INTERESTS);
  const valid =
    unique.length === 0
      ? []
      : (await prisma.tag.findMany({ where: { id: { in: unique } }, select: { id: true } })).map(
          (tag) => tag.id,
        );
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { onboardedAt: true },
  });
  await prisma.$transaction([
    prisma.userInterest.deleteMany({ where: { userId: user.id } }),
    ...(valid.length > 0
      ? [
          prisma.userInterest.createMany({
            data: valid.map((tagId) => ({ userId: user.id, tagId })),
            skipDuplicates: true,
          }),
        ]
      : []),
    prisma.user.update({
      where: { id: user.id },
      data: { onboardedAt: record?.onboardedAt ?? new Date() },
    }),
  ]);
  return { ok: true };
}
