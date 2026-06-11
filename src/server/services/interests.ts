import { prisma } from "@/lib/prisma";
import type { Tag } from "@/types/domain";
import { toTag } from "./mappers";

/**
 * Fetches the tag ids the user picked as interests, used to weight the
 * personalised "For you" feed.
 *
 * @param userId - The user id.
 * @returns The interest tag ids.
 */
export async function getInterestTagIds(userId: string): Promise<string[]> {
  const rows = await prisma.userInterest.findMany({
    where: { userId },
    select: { tagId: true },
  });
  return rows.map((row) => row.tagId);
}

/**
 * Fetches the user's interest tags (with names), so the picker can show and
 * remove them even when they fall outside the popular shortlist.
 *
 * @param userId - The user id.
 * @returns The user's interest tags, oldest pick first.
 */
export async function getInterestTags(userId: string): Promise<Tag[]> {
  const rows = await prisma.userInterest.findMany({
    where: { userId },
    include: { tag: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => toTag(row.tag));
}

/**
 * Reports whether the user has completed (or skipped) interest onboarding, used
 * to gate the one-time onboarding screen.
 *
 * @param userId - The user id.
 * @returns True once the user has been through onboarding.
 */
export async function hasOnboarded(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardedAt: true },
  });
  return user?.onboardedAt != null;
}
