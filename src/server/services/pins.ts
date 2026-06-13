import type { PinOrderByWithRelationInput, PinWhereInput } from "@/generated/prisma/models";
import { haversineKm } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import type { Pin } from "@/types/domain";
import { getFollowedBoardIds } from "./board-follows";
import { getHiddenUserIds } from "./blocks";
import { embedQuery, findSimilarPinIds, getPinVector } from "./embeddings";
import { getFollowedCreatorIds } from "./follows";
import { getInterestTagIds } from "./interests";
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
 * The visibility filter for every public pin surface: a pin shows once it is
 * published, or scheduled with its publish time already passed. Drafts and
 * not-yet-due scheduled pins are therefore hidden everywhere except their
 * owner's management views.
 *
 * @returns The Prisma where fragment restricting to publicly visible pins.
 */
export function publishedPinWhere(): PinWhereInput {
  return {
    OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", publishAt: { lte: new Date() } }],
  };
}

/**
 * Fetches all pins for the feed, newest first, excluding pins from users the
 * viewer cannot see (blocked either way, or private accounts they do not follow)
 * and any pin that is not yet publicly visible (draft or pending schedule).
 *
 * @param viewerId - The current viewer id, or null when signed out.
 * @returns The list of pins.
 */
export async function getPins(viewerId: string | null = null): Promise<Pin[]> {
  const hidden = await getFeedExcludedUserIds(viewerId);
  const rows = await prisma.pin.findMany({
    where: {
      ...publishedPinWhere(),
      ...(hidden.length > 0 ? { creatorId: { notIn: hidden } } : {}),
    },
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
  boardIds: string[];
  hiddenIds: string[];
  limit: number;
};

/**
 * Fetches one offset-paginated page of pins for an optional feed source, ordered
 * by the given sort, excluding pins from hidden (blocked or private non-followed)
 * users. When `creatorIds` is set the source is those creators, optionally
 * widened to pins belonging to any of `boardIds` (followed boards), so the
 * "Following" feed aggregates followed users and followed boards.
 *
 * @param params - The offset, sort, source filters, hidden filter and page size.
 * @returns The page of pins and whether more remain.
 */
async function getFeedPins({
  skip,
  sort,
  creatorIds,
  boardIds,
  hiddenIds,
  limit,
}: FeedPinsParams): Promise<FeedPage> {
  const filters: PinWhereInput[] = [publishedPinWhere()];
  if (creatorIds !== null) {
    filters.push(
      boardIds.length > 0
        ? {
            OR: [
              { creatorId: { in: creatorIds } },
              { boardPins: { some: { boardId: { in: boardIds } } } },
            ],
          }
        : { creatorId: { in: creatorIds } },
    );
  }
  if (hiddenIds.length > 0) {
    filters.push({ creatorId: { notIn: hiddenIds } });
  }
  const [first, ...rest] = filters;
  const where: PinWhereInput =
    first === undefined ? {} : rest.length === 0 ? first : { AND: filters };

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
  interestTag: 3,
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
 * creators they follow, the tags they chose as onboarding interests, and the
 * creators and tags drawn from pins they have liked or saved. Empty for
 * signed-out viewers, which degrades the ranking to a popularity + recency blend.
 */
export type ForYouAffinity = {
  followedCreatorIds: Set<string>;
  interestTagIds: Set<string>;
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
  let interestTags = 0;
  for (const pinTag of pin.tags) {
    if (affinity.affineTagIds.has(pinTag.tag.id)) {
      sharedTags += 1;
    }
    if (affinity.interestTagIds.has(pinTag.tag.id)) {
      interestTags += 1;
    }
  }
  score += sharedTags * FOR_YOU_WEIGHTS.sharedTag;
  score += interestTags * FOR_YOU_WEIGHTS.interestTag;
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
  const [followedIds, interestIds, likes, saves] = await Promise.all([
    getFollowedCreatorIds(viewerId),
    getInterestTagIds(viewerId),
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
  return {
    followedCreatorIds: new Set(followedIds),
    interestTagIds: new Set(interestIds),
    affineCreatorIds,
    affineTagIds,
  };
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
    interestTagIds: new Set(),
    affineCreatorIds: new Set(),
    affineTagIds: new Set(),
  };
  const [affinity, rows] = await Promise.all([
    viewerId === null ? Promise.resolve(emptyAffinity) : getForYouAffinity(viewerId),
    prisma.pin.findMany({
      where: {
        ...publishedPinWhere(),
        ...(hiddenIds.length > 0 ? { creatorId: { notIn: hiddenIds } } : {}),
      },
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
  let boardIds: string[] = [];
  if (feed === "following") {
    if (viewerId === null) {
      creatorIds = [];
    } else {
      [creatorIds, boardIds] = await Promise.all([
        getFollowedCreatorIds(viewerId),
        getFollowedBoardIds(viewerId),
      ]);
    }
  }
  return getFeedPins({ skip, sort, creatorIds, boardIds, hiddenIds, limit });
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
 * Loads pins by id and returns them in the given id order (skipping any that no
 * longer exist), used to materialise a ranked list of similarity matches.
 *
 * @param ids - The pin ids, in the desired order.
 * @returns The pins in id order.
 */
async function pinsByIds(ids: string[]): Promise<Pin[]> {
  if (ids.length === 0) {
    return [];
  }
  const rows = await prisma.pin.findMany({
    where: { id: { in: ids }, ...publishedPinWhere() },
    include: PIN_INCLUDE,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row !== undefined)
    .map(toPin);
}

/**
 * Fetches pins related to the given pin for the detail page's "More like this"
 * section: the most semantically similar pins first (by embedding cosine), then
 * topped up with the tag-overlap and recency heuristic. The pin itself and
 * hidden creators are always excluded.
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

  const vector = await getPinVector(pinId);
  const related =
    vector === null
      ? []
      : await pinsByIds(
          await findSimilarPinIds(vector, { excludePinId: pinId, excludeUserIds: hidden, limit }),
        );
  if (related.length >= limit) {
    return related;
  }

  const exclude = new Set<string>([pinId, ...related.map((pin) => pin.id)]);
  const tagIds = current.tags.map((pinTag) => pinTag.tagId);
  const sameTags =
    tagIds.length === 0
      ? []
      : (
          await prisma.pin.findMany({
            where: {
              id: { notIn: [...exclude] },
              tags: { some: { tagId: { in: tagIds } } },
              ...hiddenWhere,
              ...publishedPinWhere(),
            },
            include: PIN_INCLUDE,
            orderBy: { createdAt: "desc" },
            take: limit - related.length,
          })
        ).map(toPin);
  for (const pin of sameTags) {
    exclude.add(pin.id);
  }
  const stillNeeded = limit - related.length - sameTags.length;
  const fillers =
    stillNeeded <= 0
      ? []
      : (
          await prisma.pin.findMany({
            where: { id: { notIn: [...exclude] }, ...hiddenWhere, ...publishedPinWhere() },
            include: PIN_INCLUDE,
            orderBy: { createdAt: "desc" },
            take: stillNeeded,
          })
        ).map(toPin);
  return [...related, ...sameTags, ...fillers];
}

/**
 * Fetches the pins authored by a user, newest first.
 *
 * @param userId - The creator's user id.
 * @returns The user's pins.
 */
export async function getCreatedPins(userId: string): Promise<Pin[]> {
  const rows = await prisma.pin.findMany({
    where: { creatorId: userId, ...publishedPinWhere() },
    include: PIN_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPin);
}

/**
 * Fetches the owner's unpublished pins for their drafts management view: every
 * draft plus scheduled pins that are still upcoming. A scheduled pin that is
 * already due counts as published and appears in the normal created tab, so it
 * is excluded here. Newest first.
 *
 * @param userId - The owner's user id.
 * @returns The owner's drafts and upcoming scheduled pins.
 */
export async function getDraftAndScheduledPins(userId: string): Promise<Pin[]> {
  const rows = await prisma.pin.findMany({
    where: {
      creatorId: userId,
      OR: [{ status: "DRAFT" }, { status: "SCHEDULED", publishAt: { gt: new Date() } }],
    },
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
      AND: [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
            { creator: { name: { contains: q, mode: "insensitive" } } },
            { placeName: { contains: q, mode: "insensitive" } },
            { placeAddress: { contains: q, mode: "insensitive" } },
          ],
        },
        publishedPinWhere(),
      ],
      ...(hidden.length > 0 ? { creatorId: { notIn: hidden } } : {}),
    },
    include: PIN_INCLUDE,
    orderBy: feedOrderBy(sort),
  });
  const needle = q.toLowerCase();
  const matchesPlace = (pin: Pin): boolean =>
    pin.place !== null &&
    (pin.place.name.toLowerCase().includes(needle) ||
      (pin.place.address?.toLowerCase().includes(needle) ?? false));
  const keyword = rows.map(toPin).sort((a, b) => Number(matchesPlace(b)) - Number(matchesPlace(a)));

  const queryVector = await embedQuery(q);
  if (queryVector === null) {
    return keyword;
  }
  const semanticIds = await findSimilarPinIds(queryVector, {
    excludeUserIds: hidden,
    limit: FEED_PAGE_SIZE,
  });
  const seen = new Set(keyword.map((pin) => pin.id));
  const extra = await pinsByIds(semanticIds.filter((id) => !seen.has(id)));
  return [...keyword, ...extra];
}

/**
 * A creator's geotagged pin reduced to the fields a places map needs.
 */
export type PlacedPin = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  imageUrl: string;
};

/**
 * Fetches a user's geotagged pins (those with coordinates) for the profile
 * places map, newest first and bounded. Pins without coordinates are excluded
 * at the query, and the flatMap narrows away the nullable columns.
 *
 * @param userId - The creator's id.
 * @returns The user's placed pins.
 */
export async function getPlacedPinsForUser(userId: string): Promise<PlacedPin[]> {
  const rows = await prisma.pin.findMany({
    where: {
      creatorId: userId,
      lat: { not: null },
      lng: { not: null },
      ...publishedPinWhere(),
    },
    select: { id: true, lat: true, lng: true, title: true, imageUrl: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return rows.flatMap((row) =>
    row.lat === null || row.lng === null
      ? []
      : [{ id: row.id, lat: row.lat, lng: row.lng, title: row.title, imageUrl: row.imageUrl }],
  );
}

/**
 * Default search radius and result cap for the "near you" discovery view.
 */
const NEARBY_RADIUS_KM = 30;
const NEARBY_LIMIT = 60;
const KM_PER_DEGREE = 111;

/**
 * Finds geotagged pins near a coordinate, nearest first. A bounding box on
 * lat/lng prefilters at the database, then the exact great-circle distance is
 * computed in Node to drop the box corners and rank the results. Pins from
 * accounts the viewer cannot see are excluded, and approximate pins are already
 * stored fuzzed so their exact spot is never revealed here.
 *
 * @param viewerId - The current viewer id, or null when signed out.
 * @param lat - The viewer's latitude.
 * @param lng - The viewer's longitude.
 * @param radiusKm - The search radius in kilometres.
 * @returns The nearby pins, nearest first.
 */
export async function getNearbyPins(
  viewerId: string | null,
  lat: number,
  lng: number,
  radiusKm: number = NEARBY_RADIUS_KM,
): Promise<Pin[]> {
  const hidden = await getFeedExcludedUserIds(viewerId);
  const latDelta = radiusKm / KM_PER_DEGREE;
  const lngDelta = radiusKm / (KM_PER_DEGREE * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  const rows = await prisma.pin.findMany({
    where: {
      lat: { gte: lat - latDelta, lte: lat + latDelta },
      lng: { gte: lng - lngDelta, lte: lng + lngDelta },
      ...publishedPinWhere(),
      ...(hidden.length > 0 ? { creatorId: { notIn: hidden } } : {}),
    },
    include: PIN_INCLUDE,
  });
  return rows
    .flatMap((row) => {
      if (row.lat === null || row.lng === null) {
        return [];
      }
      const distanceKm = haversineKm(lat, lng, row.lat, row.lng);
      return distanceKm <= radiusKm ? [{ row, distanceKm }] : [];
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, NEARBY_LIMIT)
    .map((entry) => toPin(entry.row));
}

/**
 * A place page's display name and the pins tagged there.
 */
export type PlacePins = {
  name: string;
  pins: Pin[];
};

/**
 * Loads the pins for a public place page, grouped by the slug of their place
 * name. Pins from accounts the viewer cannot see are excluded, and approximate
 * pins surface at their stored (fuzzed) coordinates. Returns null when no
 * visible pin matches the slug.
 *
 * @param slug - The slugified place name.
 * @param viewerId - The current viewer id, or null when signed out.
 * @returns The place's display name and pins, or null when none match.
 */
export async function getPinsByPlaceSlug(
  slug: string,
  viewerId: string | null = null,
): Promise<PlacePins | null> {
  const hidden = await getFeedExcludedUserIds(viewerId);
  const rows = await prisma.pin.findMany({
    where: {
      placeName: { not: null },
      ...publishedPinWhere(),
      ...(hidden.length > 0 ? { creatorId: { notIn: hidden } } : {}),
    },
    include: PIN_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  const pins = rows
    .map(toPin)
    .filter((pin) => pin.place !== null && slugify(pin.place.name) === slug);
  if (pins.length === 0) {
    return null;
  }
  return { name: pins[0]?.place?.name ?? slug, pins };
}

/**
 * Lists the distinct place slugs that have at least one publicly visible pin,
 * for the sitemap. Private accounts are excluded so unindexable places are not
 * advertised.
 *
 * @returns The unique place slugs.
 */
export async function getPlaceSlugs(): Promise<string[]> {
  const hidden = await getFeedExcludedUserIds(null);
  const rows = await prisma.pin.findMany({
    where: {
      placeName: { not: null },
      ...publishedPinWhere(),
      ...(hidden.length > 0 ? { creatorId: { notIn: hidden } } : {}),
    },
    select: { placeName: true },
    take: 5000,
  });
  const slugs = new Set<string>();
  for (const row of rows) {
    if (row.placeName !== null) {
      const slug = slugify(row.placeName);
      if (slug !== "") {
        slugs.add(slug);
      }
    }
  }
  return [...slugs];
}
