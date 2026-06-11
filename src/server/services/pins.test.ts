import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pin: { findMany: vi.fn(), findUnique: vi.fn() },
    like: { findMany: vi.fn() },
    save: { findMany: vi.fn() },
    follow: { findMany: vi.fn().mockResolvedValue([]) },
    boardFollow: { findMany: vi.fn().mockResolvedValue([]) },
    user: { findMany: vi.fn().mockResolvedValue([]) },
    block: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getCreatedPins,
  getHomeFeed,
  getPinById,
  getPins,
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
  user: { findMany: Mock };
};

const NOW = new Date("2026-06-09T00:00:00Z").getTime();
const DAY = 86_400_000;

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
});

describe("rankForYou", () => {
  it("ranks a followed creator's pin above a generic recent pin", () => {
    const followed = pin("followed", { creatorId: "north" });
    const generic = pin("generic", { creatorId: "other" });
    const affinity: ForYouAffinity = { ...EMPTY, followedCreatorIds: new Set(["north"]) };
    expect(rankForYou([generic, followed], affinity, NOW)[0]?.id).toBe("followed");
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

  it("excludes pins from private accounts the viewer does not follow", async () => {
    db.user.findMany.mockResolvedValue([{ id: "priv" }]);
    db.follow.findMany.mockResolvedValue([]);
    db.pin.findMany.mockResolvedValue([]);
    await getPins("viewer");
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { creatorId: { notIn: ["priv"] } } }),
    );
  });

  it("keeps pins from a private account the viewer follows", async () => {
    db.user.findMany.mockResolvedValue([{ id: "priv" }]);
    db.follow.findMany.mockResolvedValue([{ creatorId: "priv" }]);
    db.pin.findMany.mockResolvedValue([]);
    await getPins("viewer");
    expect(db.pin.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
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
      expect.objectContaining({ where: { creatorId: { in: ["north"] } } }),
    );
  });

  it("returns an empty following feed for a signed-out viewer", async () => {
    db.pin.findMany.mockResolvedValue([]);
    await getHomeFeed({ viewerId: null, feed: "following", sort: "recent" });
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { creatorId: { in: [] } } }),
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
          OR: [
            { creatorId: { in: ["north"] } },
            { boardPins: { some: { boardId: { in: ["b1"] } } } },
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
});
