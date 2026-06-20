import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pin: { findMany: vi.fn(), findUnique: vi.fn() },
    like: { findMany: vi.fn() },
    save: { findMany: vi.fn() },
    follow: { findMany: vi.fn().mockResolvedValue([]) },
    boardFollow: { findMany: vi.fn().mockResolvedValue([]) },
    userInterest: { findMany: vi.fn().mockResolvedValue([]) },
    pinEmbedding: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: { findMany: vi.fn().mockResolvedValue([]) },
    block: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));
vi.mock("@/lib/ai", () => ({
  aiAvailable: vi.fn(() => false),
  embed: vi.fn(),
  describeImage: vi.fn(),
  suggestTags: vi.fn(),
}));

import { aiAvailable, embed } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import {
  getArchivedPins,
  getCreatedPins,
  getDraftAndScheduledPins,
  getHomeFeed,
  getNearbyPins,
  getPinById,
  getPins,
  getPinsByPlaceSlug,
  getPlacedPinsForUser,
  getPlaceSlugs,
  getRelatedPins,
  rankForYou,
  searchPins,
} from "./pins";
import type { ForYouAffinity } from "./pins";

const db = prisma as unknown as {
  pin: { findMany: Mock; findUnique: Mock };
  like: { findMany: Mock };
  save: { findMany: Mock };
  follow: { findMany: Mock };
  boardFollow: { findMany: Mock };
  userInterest: { findMany: Mock };
  pinEmbedding: { findUnique: Mock; findMany: Mock };
  user: { findMany: Mock };
};

const NOW = new Date("2026-06-09T00:00:00Z").getTime();
const DAY = 86_400_000;

const PUBLISHED_OR = [
  { status: "PUBLISHED" },
  { status: "SCHEDULED", publishAt: { lte: expect.any(Date) } },
];

type TestPin = Parameters<typeof rankForYou>[0][number];

function pin(id: string, over: Partial<TestPin> = {}): TestPin {
  return {
    id,
    creatorId: "creator",
    createdAt: new Date(NOW),
    downloadCount: 0,
    tags: [],
    _count: { likes: 0, comments: 0 },
    ...over,
  };
}

const EMPTY: ForYouAffinity = {
  followedCreatorIds: new Set(),
  interestTagIds: new Set(),
  affineCreatorIds: new Set(),
  affineTagIds: new Set(),
};

const pinRow = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  title: id,
  description: null,
  imageUrl: `/${id}.png`,
  width: 1,
  height: 1,
  link: null,
  placeName: null,
  placeAddress: null,
  lat: null,
  lng: null,
  placeApproximate: false,
  status: "PUBLISHED",
  publishAt: null,
  downloadCount: 0,
  createdAt: new Date(NOW),
  creator: {
    id: "creator",
    name: "Ada",
    username: null,
    bio: null,
    avatarUrl: null,
    followersLabel: null,
    verified: false,
  },
  tags: [],
  _count: { likes: 0, comments: 0 },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.user.findMany.mockResolvedValue([]);
  db.follow.findMany.mockResolvedValue([]);
  db.boardFollow.findMany.mockResolvedValue([]);
  db.userInterest.findMany.mockResolvedValue([]);
  db.pinEmbedding.findUnique.mockResolvedValue(null);
  db.pinEmbedding.findMany.mockResolvedValue([]);
});

describe("rankForYou", () => {
  it("ranks a followed creator's pin above a generic recent pin", () => {
    const followed = pin("followed", { creatorId: "north" });
    const generic = pin("generic", { creatorId: "other" });
    const affinity: ForYouAffinity = { ...EMPTY, followedCreatorIds: new Set(["north"]) };
    expect(rankForYou([generic, followed], affinity, NOW)[0]?.id).toBe("followed");
  });

  it("ranks pins matching interest tags above unrelated ones", () => {
    const interesting = pin("interesting", { tags: [{ tag: { id: "t1" } }] });
    const unrelated = pin("unrelated", { tags: [{ tag: { id: "t9" } }] });
    const affinity: ForYouAffinity = { ...EMPTY, interestTagIds: new Set(["t1"]) };
    expect(rankForYou([unrelated, interesting], affinity, NOW)[0]?.id).toBe("interesting");
  });

  it("ranks pins sharing affine tags above unrelated ones", () => {
    const affine = pin("affine", { tags: [{ tag: { id: "t1" } }, { tag: { id: "t2" } }] });
    const unrelated = pin("unrelated", { tags: [{ tag: { id: "t9" } }] });
    const affinity: ForYouAffinity = { ...EMPTY, affineTagIds: new Set(["t1", "t2"]) };
    expect(rankForYou([unrelated, affine], affinity, NOW)[0]?.id).toBe("affine");
  });

  it("falls back to engagement + recency with no affinity", () => {
    const popular = pin("popular", {
      createdAt: new Date(NOW - 30 * DAY),
      _count: { likes: 100, comments: 50 },
    });
    const quiet = pin("quiet", { createdAt: new Date(NOW) });
    expect(rankForYou([quiet, popular], EMPTY, NOW)[0]?.id).toBe("popular");
  });

  it("tie-breaks on recency then id, deterministically", () => {
    const older = pin("a", { createdAt: new Date(NOW - DAY) });
    const newer = pin("b", { createdAt: new Date(NOW) });
    expect(rankForYou([older, newer], EMPTY, NOW).map((p) => p.id)).toEqual(["b", "a"]);
    expect(rankForYou([pin("a"), pin("b")], EMPTY, NOW).map((p) => p.id)).toEqual(["b", "a"]);
  });
});

describe("getPins", () => {
  it("maps all pins newest first", async () => {
    db.pin.findMany.mockResolvedValue([pinRow("p1")]);
    expect((await getPins()).map((p) => p.id)).toEqual(["p1"]);
  });

  it("restricts to published or due-scheduled pins", async () => {
    db.pin.findMany.mockResolvedValue([]);
    await getPins();
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { status: "PUBLISHED" },
            { status: "SCHEDULED", publishAt: { lte: expect.any(Date) } },
          ],
        }),
      }),
    );
  });

  it("excludes pins from private accounts the viewer does not follow", async () => {
    db.user.findMany.mockResolvedValue([{ id: "priv" }]);
    db.follow.findMany.mockResolvedValue([]);
    db.pin.findMany.mockResolvedValue([]);
    await getPins("viewer");
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ creatorId: { notIn: ["priv"] } }),
      }),
    );
  });

  it("keeps pins from a private account the viewer follows", async () => {
    db.user.findMany.mockResolvedValue([{ id: "priv" }]);
    db.follow.findMany.mockResolvedValue([{ creatorId: "priv" }]);
    db.pin.findMany.mockResolvedValue([]);
    await getPins("viewer");
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: PUBLISHED_OR } }),
    );
  });
});

describe("getHomeFeed", () => {
  it("personalises the default for-you view for a signed-out viewer", async () => {
    db.pin.findMany.mockResolvedValue([pinRow("p1"), pinRow("p2")]);
    const page = await getHomeFeed({ viewerId: null, limit: 1 });
    expect(page.pins).toHaveLength(1);
    expect(page.hasMore).toBe(true);
  });

  it("builds affinity from a signed-in viewer's follows, likes and saves", async () => {
    db.follow.findMany.mockResolvedValue([{ creatorId: "north" }]);
    db.like.findMany.mockResolvedValue([{ pin: { creatorId: "c2", tags: [{ tagId: "t1" }] } }]);
    db.save.findMany.mockResolvedValue([]);
    db.pin.findMany.mockResolvedValue([pinRow("p1")]);
    const page = await getHomeFeed({ viewerId: "u1" });
    expect(page.pins.map((p) => p.id)).toEqual(["p1"]);
  });

  it("restricts the following source to followed creators", async () => {
    db.follow.findMany.mockResolvedValue([{ creatorId: "north" }]);
    db.pin.findMany.mockResolvedValue([pinRow("p1")]);
    await getHomeFeed({ viewerId: "u1", feed: "following", sort: "likes" });
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ OR: PUBLISHED_OR }, { creatorId: { in: ["north"] } }] },
      }),
    );
  });

  it("returns an empty following feed for a signed-out viewer", async () => {
    db.pin.findMany.mockResolvedValue([]);
    await getHomeFeed({ viewerId: null, feed: "following", sort: "recent" });
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ OR: PUBLISHED_OR }, { creatorId: { in: [] } }] },
      }),
    );
  });

  it("aggregates followed creators and followed boards in the following feed", async () => {
    db.follow.findMany.mockResolvedValue([{ creatorId: "north" }]);
    db.boardFollow.findMany.mockResolvedValue([{ boardId: "b1" }]);
    db.pin.findMany.mockResolvedValue([]);
    await getHomeFeed({ viewerId: "u1", feed: "following", sort: "recent" });
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { OR: PUBLISHED_OR },
            {
              OR: [
                { creatorId: { in: ["north"] } },
                { boardPins: { some: { boardId: { in: ["b1"] } } } },
              ],
            },
          ],
        },
      }),
    );
  });

  it("paginates an explicit sort and flags more pages", async () => {
    db.pin.findMany.mockResolvedValue(Array.from({ length: 25 }, (_, i) => pinRow(`p${i}`)));
    const page = await getHomeFeed({ viewerId: null, feed: "foryou", sort: "downloads" });
    expect(page.pins).toHaveLength(24);
    expect(page.hasMore).toBe(true);
  });
});

describe("getPinById", () => {
  it("maps a found pin or returns null", async () => {
    db.pin.findUnique.mockResolvedValue(pinRow("p1"));
    expect((await getPinById("p1"))?.id).toBe("p1");
    db.pin.findUnique.mockResolvedValue(null);
    expect(await getPinById("missing")).toBeNull();
  });
});

describe("getRelatedPins", () => {
  it("returns an empty list when the pin does not exist", async () => {
    db.pin.findUnique.mockResolvedValue(null);
    expect(await getRelatedPins("p1")).toEqual([]);
  });

  it("returns same-tag pins when there are enough", async () => {
    db.pin.findUnique.mockResolvedValue({ tags: [{ tagId: "t1" }] });
    db.pin.findMany.mockResolvedValueOnce([pinRow("a"), pinRow("b")]);
    expect((await getRelatedPins("p1", 2)).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("tops up with filler pins when tags are insufficient", async () => {
    db.pin.findUnique.mockResolvedValue({ tags: [] });
    db.pin.findMany.mockResolvedValueOnce([pinRow("filler")]);
    expect((await getRelatedPins("p1", 3)).map((p) => p.id)).toEqual(["filler"]);
  });

  it("ranks semantically similar pins first when the pin has an embedding", async () => {
    db.pin.findUnique.mockResolvedValue({ tags: [] });
    db.pinEmbedding.findUnique.mockResolvedValue({ vector: [1, 0] });
    db.pinEmbedding.findMany.mockResolvedValue([{ pinId: "s1", vector: [1, 0] }]);
    db.pin.findMany.mockResolvedValueOnce([pinRow("s1")]).mockResolvedValue([]);
    expect((await getRelatedPins("p1", 16)).map((p) => p.id)).toEqual(["s1"]);
    expect(db.pinEmbedding.findMany).toHaveBeenCalled();
  });
});

describe("getCreatedPins", () => {
  it("maps a creator's pins", async () => {
    db.pin.findMany.mockResolvedValue([pinRow("p1")]);
    expect((await getCreatedPins("u1")).map((p) => p.id)).toEqual(["p1"]);
  });
});

describe("searchPins", () => {
  it("returns an empty list for a blank query without querying", async () => {
    expect(await searchPins("   ")).toEqual([]);
    expect(db.pin.findMany).not.toHaveBeenCalled();
  });

  it("matches by title, tag or creator name", async () => {
    db.pin.findMany.mockResolvedValue([pinRow("p1")]);
    expect((await searchPins("sun", "likes")).map((p) => p.id)).toEqual(["p1"]);
  });

  it("matches pins by their place name or address", async () => {
    db.pin.findMany.mockResolvedValue([]);
    await searchPins("stade");
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                { placeName: { contains: "stade", mode: "insensitive" } },
                { placeAddress: { contains: "stade", mode: "insensitive" } },
              ]),
            }),
          ]),
        }),
      }),
    );
  });

  it("ranks pins matching the place above the others", async () => {
    db.pin.findMany.mockResolvedValue([
      pinRow("other"),
      pinRow("atplace", {
        placeName: "Stade de France",
        placeAddress: "Saint-Denis",
        lat: 48.92,
        lng: 2.36,
        placeApproximate: false,
      }),
    ]);
    expect((await searchPins("stade")).map((p) => p.id)).toEqual(["atplace", "other"]);
  });

  it("appends semantic matches after the keyword results when AI is available", async () => {
    vi.mocked(aiAvailable).mockReturnValue(true);
    vi.mocked(embed).mockResolvedValue([1, 0]);
    db.pin.findMany.mockResolvedValueOnce([pinRow("kw")]).mockResolvedValueOnce([pinRow("sem")]);
    db.pinEmbedding.findMany.mockResolvedValue([{ pinId: "sem", vector: [1, 0] }]);
    expect((await searchPins("bikes")).map((p) => p.id)).toEqual(["kw", "sem"]);
  });
});

describe("getPlacedPinsForUser", () => {
  it("queries only the user's geotagged pins and maps them", async () => {
    db.pin.findMany.mockResolvedValue([
      { id: "p1", lat: 48.85, lng: 2.35, title: "Paris", imageUrl: "/p1.png" },
    ]);
    const result = await getPlacedPinsForUser("u1");
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          creatorId: "u1",
          lat: { not: null },
          lng: { not: null },
        }),
      }),
    );
    expect(result).toEqual([
      { id: "p1", lat: 48.85, lng: 2.35, title: "Paris", imageUrl: "/p1.png" },
    ]);
  });

  it("drops any row whose coordinates came back null", async () => {
    db.pin.findMany.mockResolvedValue([
      { id: "p1", lat: 48.85, lng: 2.35, title: "Paris", imageUrl: "/p1.png" },
      { id: "p2", lat: null, lng: null, title: "Ghost", imageUrl: "/p2.png" },
    ]);
    const result = await getPlacedPinsForUser("u1");
    expect(result.map((pin) => pin.id)).toEqual(["p1"]);
  });
});

describe("getNearbyPins", () => {
  it("keeps pins within the radius and orders them nearest first", async () => {
    db.pin.findMany.mockResolvedValue([
      pinRow("far", { lat: 49.2, lng: 2.35 }),
      pinRow("near", { lat: 48.86, lng: 2.35 }),
      pinRow("mid", { lat: 48.95, lng: 2.35 }),
    ]);
    const pins = await getNearbyPins(null, 48.85, 2.35);
    expect(pins.map((p) => p.id)).toEqual(["near", "mid"]);
  });

  it("drops a row that has no coordinates", async () => {
    db.pin.findMany.mockResolvedValue([
      pinRow("near", { lat: 48.86, lng: 2.35 }),
      pinRow("noco", { lat: null, lng: null }),
    ]);
    const pins = await getNearbyPins(null, 48.85, 2.35);
    expect(pins.map((p) => p.id)).toEqual(["near"]);
  });
});

describe("getPinsByPlaceSlug", () => {
  it("groups the visible pins whose place name slugifies to the slug", async () => {
    db.pin.findMany.mockResolvedValue([
      pinRow("a", { placeName: "Stade de France", lat: 48.9, lng: 2.3 }),
      pinRow("b", { placeName: "Central Park", lat: 40.7, lng: -73.9 }),
      pinRow("c", { placeName: "Stade de France", lat: 48.9, lng: 2.3 }),
    ]);
    const result = await getPinsByPlaceSlug("stade-de-france");
    expect(result?.name).toBe("Stade de France");
    expect(result?.pins.map((p) => p.id)).toEqual(["a", "c"]);
  });

  it("returns null when no pin matches the slug", async () => {
    db.pin.findMany.mockResolvedValue([
      pinRow("a", { placeName: "Central Park", lat: 40.7, lng: -73.9 }),
    ]);
    expect(await getPinsByPlaceSlug("nowhere")).toBeNull();
  });
});

describe("getPlaceSlugs", () => {
  it("returns the distinct slugs of places that have pins", async () => {
    db.pin.findMany.mockResolvedValue([
      { placeName: "Stade de France" },
      { placeName: "Central Park" },
      { placeName: "stade de france" },
    ]);
    expect((await getPlaceSlugs()).sort()).toEqual(["central-park", "stade-de-france"]);
  });
});

describe("getDraftAndScheduledPins", () => {
  it("queries the owner's drafts and upcoming scheduled pins", async () => {
    db.pin.findMany.mockResolvedValue([]);
    await getDraftAndScheduledPins("u1");
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          creatorId: "u1",
          OR: [{ status: "DRAFT" }, { status: "SCHEDULED", publishAt: { gt: expect.any(Date) } }],
        },
      }),
    );
  });
});

describe("getArchivedPins", () => {
  it("queries the owner's archived pins", async () => {
    db.pin.findMany.mockResolvedValue([]);
    await getArchivedPins("u1");
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { creatorId: "u1", status: "ARCHIVED" },
      }),
    );
  });
});
