"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Returns the UTC midnight of a date, used as the per-day bucket that
 * deduplicates pin views (one view per viewer per pin per day).
 *
 * @param date - The reference date.
 * @returns A date at 00:00:00 UTC of the same day.
 */
function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Records that the current user viewed a pin, deduplicated to one view per
 * viewer per pin per UTC day. Signed-out viewers and the pin's own creator are
 * not counted. Best-effort and silent so it never affects rendering the pin.
 *
 * @param pinId - The viewed pin.
 */
export async function recordPinView(pinId: string): Promise<void> {
  const user = await getCurrentUser();
  if (user === null) {
    return;
  }
  const pin = await prisma.pin.findUnique({ where: { id: pinId }, select: { creatorId: true } });
  if (pin === null || pin.creatorId === user.id) {
    return;
  }
  await prisma.pinView.createMany({
    data: [{ pinId, viewerId: user.id, viewedOn: startOfUtcDay(new Date()) }],
    skipDuplicates: true,
  });
}
