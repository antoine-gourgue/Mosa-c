import { prisma } from "@/lib/prisma";

/**
 * Fetches the tag ids the user picked as interests, used to pre-select the
 * interest picker and to weight the personalised "For you" feed.
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
