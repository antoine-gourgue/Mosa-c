import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { rankForYou } from "./pins";
import type { ForYouAffinity } from "./pins";

const NOW = new Date("2026-06-09T00:00:00Z").getTime();
const DAY = 86_400_000;

type TestPin = Parameters<typeof rankForYou>[0][number];

/**
 * Builds a candidate pin for the ranking tests with sensible defaults.
 *
 * @param id - The pin id.
 * @param over - Field overrides.
 * @returns The test pin.
 */
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

describe("rankForYou", () => {
  it("ranks a followed creator's pin above a generic recent pin", () => {
    const followed = pin("followed", { creatorId: "north" });
    const generic = pin("generic", { creatorId: "other" });
    const affinity: ForYouAffinity = { ...EMPTY, followedCreatorIds: new Set(["north"]) };
    const ranked = rankForYou([generic, followed], affinity, NOW);
    expect(ranked[0]?.id).toBe("followed");
  });

  it("ranks pins sharing affine tags above unrelated ones", () => {
    const affine = pin("affine", { tags: [{ tag: { id: "t1" } }, { tag: { id: "t2" } }] });
    const unrelated = pin("unrelated", { tags: [{ tag: { id: "t9" } }] });
    const affinity: ForYouAffinity = { ...EMPTY, affineTagIds: new Set(["t1", "t2"]) };
    const ranked = rankForYou([unrelated, affine], affinity, NOW);
    expect(ranked[0]?.id).toBe("affine");
  });

  it("falls back to engagement + recency with no affinity", () => {
    const popular = pin("popular", {
      createdAt: new Date(NOW - 30 * DAY),
      _count: { likes: 100, comments: 50 },
    });
    const quiet = pin("quiet", { createdAt: new Date(NOW) });
    const ranked = rankForYou([quiet, popular], EMPTY, NOW);
    expect(ranked[0]?.id).toBe("popular");
  });

  it("tie-breaks on recency then id, deterministically", () => {
    const older = pin("a", { createdAt: new Date(NOW - DAY) });
    const newer = pin("b", { createdAt: new Date(NOW) });
    expect(rankForYou([older, newer], EMPTY, NOW).map((p) => p.id)).toEqual(["b", "a"]);

    const sameTimeA = pin("a");
    const sameTimeB = pin("b");
    expect(rankForYou([sameTimeA, sameTimeB], EMPTY, NOW).map((p) => p.id)).toEqual(["b", "a"]);
  });
});
