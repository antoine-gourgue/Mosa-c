import type { PinOrderByWithRelationInput, PinWhereInput } from "@/generated/prisma/models";
import { prisma } from "@/lib/prisma";
import type { Pin } from "@/types/domain";
import { getHiddenUserIds } from "./blocks";
import { getFollowedCreatorIds } from "./follows";
import { PIN_INCLUDE, toPin } from "./mappers";

/**
 * Resolves the creator ids whose pins must be kept out of a viewer's discovery
 * surfaces (home feed, "For you", search, related). This is the union of:
 *
 * - users the viewer has blocked or who have blocked the viewer; and
 * - private accounts the viewer neither follows nor owns, since a private
 *   account's pins are only visible to approved followers.
 *
 * @param viewerId - The current viewer id, or null when signed out.
 * @returns The creator ids to exclude.
 */
async function getFeedExcludedUserIds(viewerId: string | null): Promise<string[]> {
  const [hidden, privateUsers] = await Promise.all([
    getHiddenUserIds(viewerId),
    prisma.user.findMany({ where: { isPrivate: true }, select: { id: true } }),
  ]);
  const excluded = new Set(hidden);
  if (privateUsers.length === 0) {
    return [...excluded];
  }
  const allowed = new Set<string>();
  if (viewerId !== null) {
    allowed.add(viewerId);
    for (const id of await getFollowedCreatorIds(viewerId)) {
      allowed.add(id);
    }
  }
  for (const user of privateUsers) {
    if (!allowed.has(user.id)) {
      excluded.add(user.id);
    }
  }
  return [...excluded];
}

/**
 * Fetches all pins for the feed, newest first, excluding pins from users the
 * viewer cannot see (blocked either way, or private accounts they do not follow).
 *
 * @param viewerId - The current viewer id, or null when signed out.
 * @returns The list of pins.
 */
export async function getPins(viewerId: string | null = null): Promise<Pin[]> {
  const hidden = await getFeedExcludedUserIds(viewerId);
  const rows = await prisma.pin.findMany({
    where: hidden.length > 0 ? { creatorId: { notIn: hidden } } : {},
    include: PIN_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
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
  hiddenIds: string[];
  limit: number;
};

/**
 * Fetches one offset-paginated page of pins for an optional set of creators,
 * ordered by the given sort, excluding pins from hidden (blocked) users.
 *
 * @param params - The offset, sort, creator filter, hidden filter and page size.
 * @returns The page of pins and whether more remain.
 */
async function getFeedPins({
  skip,
  sort,
  creatorIds,
  hiddenIds,
  limit,
}: FeedPinsParams): Promise<FeedPage> {
  const where: { creatorId?: { in?: string[]; notIn?: string[] } } = {};
  if (creatorIds !== null) {
    where.creatorId = { in: creatorIds };
  }
  if (hiddenIds.length > 0) {
    where.creatorId = { ...(where.creatorId ?? {}), notIn: hiddenIds };
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
 * Number of recent pins scored as candidates for the personalised "For you"
 * feed. Bounding the window keeps the in-memory ranking cheap.
 */
const FOR_YOU_WINDOW = 400;

/**
 * Relative weights of each "For you" ranking signal.
 */
const FOR_YOU_WEIGHTS = {
  followedCreator: 5,
  affineCreator: 2,
  sharedTag: 1.5,
  engagement: 1,
  recency: 2,
};

/**
 * Half-life (in days) of the recency boost in the "For you" ranking.
 */
const FOR_YOU_RECENCY_HALFLIFE_DAYS = 7;

/**
 * The viewer's affinity signals used to personalise the "For you" feed: the
 * creators they follow, and the creators and tags drawn from pins they have
 * liked or saved. Empty for signed-out viewers, which degrades the ranking to a
 * popularity + recency blend.
 */
export type ForYouAffinity = {
  followedCreatorIds: Set<string>;
  affineCreatorIds: Set<string>;
  affineTagIds: Set<string>;
};

/**
 * The minimal pin shape the "For you" ranking scores.
 */
type ScoredPin = {
  id: string;
  creatorId: string;
  createdAt: Date;
  downloadCount: number;
  tags: { tag: { id: string } }[];
  _count: { likes: number; comments: number };
};

/**
 * Scores a candidate pin for the "For you" feed by blending follow and affinity
 * matches, engagement and a recency decay.
 *
 * @param pin - The candidate pin.
 * @param affinity - The viewer's affinity signals.
 * @param now - The current time in milliseconds (injected for determinism).
 * @returns The pin's score; higher ranks higher.
 */
function scoreForYou(pin: ScoredPin, affinity: ForYouAffinity, now: number): number {
  let score = 0;
  if (affinity.followedCreatorIds.has(pin.creatorId)) {
    score += FOR_YOU_WEIGHTS.followedCreator;
  }
  if (affinity.affineCreatorIds.has(pin.creatorId)) {
    score += FOR_YOU_WEIGHTS.affineCreator;
  }
  let sharedTags = 0;
  for (const pinTag of pin.tags) {
    if (affinity.affineTagIds.has(pinTag.tag.id)) {
      sharedTags += 1;
    }
  }
  score += sharedTags * FOR_YOU_WEIGHTS.sharedTag;
  const engagement = pin._count.likes + pin._count.comments + pin.downloadCount;
  score += Math.log1p(engagement) * FOR_YOU_WEIGHTS.engagement;
  const ageDays = Math.max(0, (now - pin.createdAt.getTime()) / 86_400_000);
  score += Math.exp(-ageDays / FOR_YOU_RECENCY_HALFLIFE_DAYS) * FOR_YOU_WEIGHTS.recency;
  return score;
}

/**
 * Ranks candidate pins for the "For you" feed by descending score, tie-breaking
 * on recency then id so the order is deterministic and stable across pages. Pure
 * over its inputs to keep it unit-testable.
 *
 * @param pins - The candidate pins.
 * @param affinity - The viewer's affinity signals.
 * @param now - The current time in milliseconds.
 * @returns The pins ordered best-first.
 */
export function rankForYou<T extends ScoredPin>(
  pins: T[],
  affinity: ForYouAffinity,
  now: number,
): T[] {
  return pins
    .map((pin) => ({ pin, score: scoreForYou(pin, affinity, now) }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const byRecency = b.pin.createdAt.getTime() - a.pin.createdAt.getTime();
      if (byRecency !== 0) {
        return byRecency;
      }
      return a.pin.id < b.pin.id ? 1 : a.pin.id > b.pin.id ? -1 : 0;
    })
    .map((entry) => entry.pin);
}

/**
 * Builds the viewer's affinity signals from their follows, likes and saves.
 *
 * @param viewerId - The signed-in viewer id.
 * @returns The viewer's affinity sets.
 */
async function getForYouAffinity(viewerId: string): Promise<ForYouAffinity> {
  const pinSelect = { pin: { select: { creatorId: true, tags: { select: { tagId: true } } } } };
  const [followedIds, likes, saves] = await Promise.all([
    getFollowedCreatorIds(viewerId),
    prisma.like.findMany({
      where: { userId: viewerId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: pinSelect,
    }),
    prisma.save.findMany({
      where: { userId: viewerId },
      orderBy: { savedAt: "desc" },
      take: 200,
      select: pinSelect,
    }),
  ]);
  const affineCreatorIds = new Set<string>();
  const affineTagIds = new Set<string>();
  for (const { pin } of [...likes, ...saves]) {
    affineCreatorIds.add(pin.creatorId);
    for (const tag of pin.tags) {
      affineTagIds.add(tag.tagId);
    }
  }
  return { followedCreatorIds: new Set(followedIds), affineCreatorIds, affineTagIds };
}

/**
 * Builds the personalised "For you" page: scores a bounded window of recent pins
 * against the viewer's affinity and paginates the ranked result. Signed-out
 * viewers get an empty affinity, which reduces the ranking to popularity +
 * recency.
 *
 * @param params - The viewer id, offset and page size.
 * @returns The page of ranked pins and whether more remain.
 */
async function getForYouFeed(params: {
  viewerId: string | null;
  hiddenIds: string[];
  skip: number;
  limit: number;
}): Promise<FeedPage> {
  const { viewerId, hiddenIds, skip, limit } = params;
  const emptyAffinity: ForYouAffinity = {
    followedCreatorIds: new Set(),
    affineCreatorIds: new Set(),
    affineTagIds: new Set(),
  };
  const [affinity, rows] = await Promise.all([
    viewerId === null ? Promise.resolve(emptyAffinity) : getForYouAffinity(viewerId),
    prisma.pin.findMany({
      where: hiddenIds.length > 0 ? { creatorId: { notIn: hiddenIds } } : {},
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: FOR_YOU_WINDOW,
      include: PIN_INCLUDE,
    }),
  ]);
  const ranked = rankForYou(rows, affinity, Date.now());
  const page = ranked.slice(skip, skip + limit);
  return { pins: page.map(toPin), hasMore: ranked.length > skip + limit };
}

/**
 * Fetches a page of the home feed for the chosen source and sort. The default
 * "For you" view (recency sort) is personalised by {@link getForYouFeed}; the
 * "following" source restricts pins to the viewer's followed creators, and the
 * explicit sorts keep their straight ordering.
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
  const hiddenIds = await getFeedExcludedUserIds(viewerId);
  if (feed === "foryou" && sort === "recent") {
    return getForYouFeed({ viewerId, hiddenIds, skip, limit });
  }
  let creatorIds: string[] | null = null;
  if (feed === "following") {
    creatorIds = viewerId === null ? [] : await getFollowedCreatorIds(viewerId);
  }
  return getFeedPins({ skip, sort, creatorIds, hiddenIds, limit });
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
 * @param viewerId - The current viewer id, or null when signed out.
 * @returns The related pins.
 */
export async function getRelatedPins(
  pinId: string,
  limit = 16,
  viewerId: string | null = null,
): Promise<Pin[]> {
  const current = await prisma.pin.findUnique({
    where: { id: pinId },
    select: { tags: { select: { tagId: true } } },
  });
  if (current === null) {
    return [];
  }
  const hidden = await getFeedExcludedUserIds(viewerId);
  const hiddenWhere: PinWhereInput = hidden.length > 0 ? { creatorId: { notIn: hidden } } : {};
  const tagIds = current.tags.map((pinTag) => pinTag.tagId);
  const sameTags =
    tagIds.length === 0
      ? []
      : (
          await prisma.pin.findMany({
            where: {
              id: { not: pinId },
              tags: { some: { tagId: { in: tagIds } } },
              ...hiddenWhere,
            },
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
      where: { id: { notIn: excludeIds }, ...hiddenWhere },
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
 * @param viewerId - The current viewer id, or null when signed out.
 * @returns The matching pins, or an empty list for a blank query.
 */
export async function searchPins(
  query: string,
  sort: FeedSort = "recent",
  viewerId: string | null = null,
): Promise<Pin[]> {
  const q = query.trim();
  if (q === "") {
    return [];
  }
  const hidden = await getFeedExcludedUserIds(viewerId);
  const rows = await prisma.pin.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
        { creator: { name: { contains: q, mode: "insensitive" } } },
      ],
      ...(hidden.length > 0 ? { creatorId: { notIn: hidden } } : {}),
    },
    include: PIN_INCLUDE,
    orderBy: feedOrderBy(sort),
  });
  return rows.map(toPin);
}
