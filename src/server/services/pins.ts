import { prisma } from "@/lib/prisma";
import type { Pin } from "@/types/domain";
import { getFollowedCreatorIds } from "./follows";
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
 * The selectable home feed sources.
 */
export type FeedSource = "foryou" | "following";

/**
 * A page of feed pins with the cursor for the next page.
 */
export type FeedPage = {
  pins: Pin[];
  nextCursor: string | null;
};

/**
 * Number of pins returned per feed page.
 */
export const FEED_PAGE_SIZE = 24;

type FeedPinsParams = {
  cursor: string | null;
  category: string | null;
  creatorIds: string[] | null;
  limit: number;
};

/**
 * Fetches one cursor-paginated page of pins matching an optional category and
 * an optional set of creators, newest first with a stable id tiebreaker.
 *
 * @param params - The cursor, category slug, creator filter and page size.
 * @returns The page of pins and the next cursor (null when exhausted).
 */
async function getFeedPins({
  cursor,
  category,
  creatorIds,
  limit,
}: FeedPinsParams): Promise<FeedPage> {
  const where: { category?: { slug: string }; creatorId?: { in: string[] } } = {};
  if (category !== null) {
    where.category = { slug: category };
  }
  if (creatorIds !== null) {
    where.creatorId = { in: creatorIds };
  }

  const rows = await prisma.pin.findMany({
    where,
    include: PIN_INCLUDE,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor === null ? {} : { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (page.at(-1)?.id ?? null) : null;
  return { pins: page.map(toPin), nextCursor };
}

/**
 * Fetches a page of the home feed for the chosen source and category. The
 * "following" source restricts pins to the viewer's followed creators.
 *
 * @param params - The cursor, category slug, feed source and viewer id.
 * @returns The page of pins and the next cursor.
 */
export async function getHomeFeed(params: {
  cursor?: string | null;
  category?: string | null;
  feed?: FeedSource;
  viewerId: string | null;
  limit?: number;
}): Promise<FeedPage> {
  const {
    cursor = null,
    category = null,
    feed = "foryou",
    viewerId,
    limit = FEED_PAGE_SIZE,
  } = params;
  let creatorIds: string[] | null = null;
  if (feed === "following") {
    creatorIds = viewerId === null ? [] : await getFollowedCreatorIds(viewerId);
  }
  return getFeedPins({ cursor, category, creatorIds, limit });
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
 * Fetches the pins authored by a user, newest first.
 *
 * @param userId - The creator's user id.
 * @returns The user's pins.
 */
export async function getCreatedPins(userId: string): Promise<Pin[]> {
  const rows = await prisma.pin.findMany({
    where: { creatorId: userId },
    include: PIN_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPin);
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
