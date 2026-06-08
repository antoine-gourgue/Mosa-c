import type { PinOrderByWithRelationInput } from "@/generated/prisma/models";
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
 * The selectable home feed sort orders.
 */
export type FeedSort = "recent" | "likes" | "downloads" | "comments";

/**
 * A page of feed pins with whether more pages remain.
 */
export type FeedPage = {
  pins: Pin[];
  hasMore: boolean;
};

/**
 * Number of pins returned per feed page.
 */
export const FEED_PAGE_SIZE = 24;

/**
 * Resolves the Prisma order clause for a feed sort, always tie-breaking on
 * recency and id so paging is stable.
 *
 * @param sort - The feed sort order.
 * @returns The Prisma orderBy array.
 */
function feedOrderBy(sort: FeedSort): PinOrderByWithRelationInput[] {
  const tiebreak: PinOrderByWithRelationInput[] = [{ createdAt: "desc" }, { id: "desc" }];
  switch (sort) {
    case "likes":
      return [{ likes: { _count: "desc" } }, ...tiebreak];
    case "comments":
      return [{ comments: { _count: "desc" } }, ...tiebreak];
    case "downloads":
      return [{ downloadCount: "desc" }, ...tiebreak];
    case "recent":
      return tiebreak;
  }
}

type FeedPinsParams = {
  skip: number;
  sort: FeedSort;
  creatorIds: string[] | null;
  limit: number;
};

/**
 * Fetches one offset-paginated page of pins for an optional set of creators,
 * ordered by the given sort.
 *
 * @param params - The offset, sort, creator filter and page size.
 * @returns The page of pins and whether more remain.
 */
async function getFeedPins({ skip, sort, creatorIds, limit }: FeedPinsParams): Promise<FeedPage> {
  const where: { creatorId?: { in: string[] } } = {};
  if (creatorIds !== null) {
    where.creatorId = { in: creatorIds };
  }

  const rows = await prisma.pin.findMany({
    where,
    include: PIN_INCLUDE,
    orderBy: feedOrderBy(sort),
    skip,
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return { pins: page.map(toPin), hasMore };
}

/**
 * Fetches a page of the home feed for the chosen source and sort. The
 * "following" source restricts pins to the viewer's followed creators.
 *
 * @param params - The offset, sort, feed source and viewer id.
 * @returns The page of pins and whether more remain.
 */
export async function getHomeFeed(params: {
  skip?: number;
  sort?: FeedSort;
  feed?: FeedSource;
  viewerId: string | null;
  limit?: number;
}): Promise<FeedPage> {
  const { skip = 0, sort = "recent", feed = "foryou", viewerId, limit = FEED_PAGE_SIZE } = params;
  let creatorIds: string[] | null = null;
  if (feed === "following") {
    creatorIds = viewerId === null ? [] : await getFollowedCreatorIds(viewerId);
  }
  return getFeedPins({ skip, sort, creatorIds, limit });
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
 * Fetches pins related to the given pin for the detail page's "More like this"
 * section: pins sharing any of the pin's tags first, newest first, topped up
 * with other recent pins when the tags do not have enough. The pin itself is
 * always excluded.
 *
 * @param pinId - The pin to find neighbours for.
 * @param limit - The maximum number of related pins to return.
 * @returns The related pins.
 */
export async function getRelatedPins(pinId: string, limit = 16): Promise<Pin[]> {
  const current = await prisma.pin.findUnique({
    where: { id: pinId },
    select: { tags: { select: { tagId: true } } },
  });
  if (current === null) {
    return [];
  }
  const tagIds = current.tags.map((pinTag) => pinTag.tagId);
  const sameTags =
    tagIds.length === 0
      ? []
      : (
          await prisma.pin.findMany({
            where: { id: { not: pinId }, tags: { some: { tagId: { in: tagIds } } } },
            include: PIN_INCLUDE,
            orderBy: { createdAt: "desc" },
            take: limit,
          })
        ).map(toPin);
  if (sameTags.length >= limit) {
    return sameTags;
  }
  const excludeIds = [pinId, ...sameTags.map((pin) => pin.id)];
  const fillers = (
    await prisma.pin.findMany({
      where: { id: { notIn: excludeIds } },
      include: PIN_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit - sameTags.length,
    })
  ).map(toPin);
  return [...sameTags, ...fillers];
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
 * Searches pins by title, tag name or creator name, case-insensitively,
 * ordered by the given sort.
 *
 * @param query - The raw search query.
 * @param sort - The sort order, defaulting to most recent.
 * @returns The matching pins, or an empty list for a blank query.
 */
export async function searchPins(query: string, sort: FeedSort = "recent"): Promise<Pin[]> {
  const q = query.trim();
  if (q === "") {
    return [];
  }
  const rows = await prisma.pin.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
        { creator: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: PIN_INCLUDE,
    orderBy: feedOrderBy(sort),
  });
  return rows.map(toPin);
}
