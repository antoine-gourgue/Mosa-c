import { prisma } from "@/lib/prisma";

/**
 * How many AI image generations a single account may run per rolling 24 hours.
 * Pollinations is free and keyless, so this only guards against one account (or
 * abuse) hammering the shared generator.
 */
export const IMAGE_GENERATION_DAILY_LIMIT = 5;

const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Returns how many AI image generations the user has left in the current rolling
 * 24-hour window (zero when the limit is reached).
 *
 * @param userId - The user to check.
 * @returns The remaining generations, never negative.
 */
export async function imageGenerationsRemaining(userId: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MS);
  const used = await prisma.aiImageGeneration.count({
    where: { userId, createdAt: { gte: since } },
  });
  return Math.max(0, IMAGE_GENERATION_DAILY_LIMIT - used);
}

/**
 * Records that the user ran one AI image generation, counting against their
 * daily allowance.
 *
 * @param userId - The user who generated an image.
 */
export async function recordImageGeneration(userId: string): Promise<void> {
  await prisma.aiImageGeneration.create({ data: { userId } });
}
