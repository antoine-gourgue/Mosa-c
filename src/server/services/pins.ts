import { prisma } from "@/lib/prisma";
import type { Pin } from "@/types/domain";
import { PIN_INCLUDE, toPin } from "./mappers";

/**
 * Fetches all pins for the feed, newest first.
 *
 * @returns The list of pins.
 */
export async function getPins(): Promise<Pin[]> {
  const rows = await prisma.pin.findMany({ include: PIN_INCLUDE, orderBy: { createdAt: "desc" } });
  return rows.map(toPin);
}

/**
 * Fetches a single pin by id.
 *
 * @param id - The pin id.
 * @returns The pin, or null when it does not exist.
 */
export async function getPinById(id: string): Promise<Pin | null> {
  const row = await prisma.pin.findUnique({ where: { id }, include: PIN_INCLUDE });
  return row === null ? null : toPin(row);
}

/**
 * Searches pins by title, category label or creator name, case-insensitively.
 *
 * @param query - The raw search query.
 * @returns The matching pins, or an empty list for a blank query.
 */
export async function searchPins(query: string): Promise<Pin[]> {
  const q = query.trim();
  if (q === "") {
    return [];
  }
  const rows = await prisma.pin.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { category: { label: { contains: q, mode: "insensitive" } } },
        { creator: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: PIN_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPin);
}
