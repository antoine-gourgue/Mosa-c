import { prisma } from "@/lib/prisma";
import type { Pin } from "@/types/domain";
import { PIN_INCLUDE, toPin } from "./mappers";

/**
 * Fetches the ids of pins saved by a user.
 *
 * @param userId - The user id.
 * @returns The saved pin ids.
 */
export async function getSavedPinIds(userId: string): Promise<string[]> {
  const rows = await prisma.save.findMany({ where: { userId }, select: { pinId: true } });
  return rows.map((row) => row.pinId);
}

/**
 * Fetches the pins saved by a user, most recently saved first.
 *
 * @param userId - The user id.
 * @returns The saved pins.
 */
export async function getSavedPins(userId: string): Promise<Pin[]> {
  const rows = await prisma.save.findMany({
    where: { userId },
    include: { pin: { include: PIN_INCLUDE } },
    orderBy: { savedAt: "desc" },
  });
  return rows.map((row) => toPin(row.pin));
}

/**
 * Checks whether a user has saved a pin.
 *
 * @param userId - The user id.
 * @param pinId - The pin id.
 * @returns True when the pin is saved.
 */
export async function isSaved(userId: string, pinId: string): Promise<boolean> {
  const row = await prisma.save.findUnique({ where: { userId_pinId: { userId, pinId } } });
  return row !== null;
}
