import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tag: { findMany: vi.fn(), findUnique: vi.fn() },
    pin: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getPinsByTag, getPopularTags, getTagBySlug, searchTagResults, searchTags } from "./tags";

const db = prisma as unknown as {
  tag: { findMany: Mock; findUnique: Mock };
  pin: { findMany: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getPopularTags", () => {
  it("projects each tag's pin count", async () => {
    db.tag.findMany.mockResolvedValue([
      { id: "t1", slug: "art", name: "Art", _count: { pins: 12 } },
      { id: "t2", slug: "food", name: "Food", _count: { pins: 3 } },
    ]);
    const tags = await getPopularTags();
    expect(tags).toEqual([
      { id: "t1", slug: "art", name: "Art", pinCount: 12 },
      { id: "t2", slug: "food", name: "Food", pinCount: 3 },
    ]);
  });

  it("passes the limit through to the query", async () => {
    db.tag.findMany.mockResolvedValue([]);
    await getPopularTags(5);
    expect(db.tag.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
  });
});

describe("getTagBySlug", () => {
  it("maps a found tag", async () => {
    db.tag.findUnique.mockResolvedValue({ id: "t1", slug: "art", name: "Art" });
    expect(await getTagBySlug("art")).toEqual({ id: "t1", slug: "art", name: "Art" });
  });

  it("returns null when missing", async () => {
    db.tag.findUnique.mockResolvedValue(null);
    expect(await getTagBySlug("nope")).toBeNull();
  });
});

describe("getPinsByTag", () => {
  it("maps the pins carrying the tag", async () => {
    db.pin.findMany.mockResolvedValue([
      {
        id: "p1",
        title: "Sunset",
        description: null,
        imageUrl: "/p.png",
        width: 1,
        height: 1,
        link: null,
        downloadCount: 0,
        creator: {
          id: "u1",
          name: "Ada",
          username: null,
          bio: null,
          avatarUrl: null,
          followersLabel: null,
          verified: false,
        },
        tags: [],
        _count: { likes: 0, comments: 0 },
      },
    ]);
    const pins = await getPinsByTag("art");
    expect(pins).toHaveLength(1);
    expect(pins[0]?.id).toBe("p1");
    expect(db.pin.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tags: { some: { tag: { slug: "art" } } } }),
      }),
    );
  });
});

describe("searchTagResults", () => {
  it("returns an empty list for a blank query without querying", async () => {
    expect(await searchTagResults("   ")).toEqual([]);
    expect(db.tag.findMany).not.toHaveBeenCalled();
  });

  it("returns each tag's count and preview thumbnails", async () => {
    db.tag.findMany.mockResolvedValue([
      { id: "t1", slug: "art", name: "Art", _count: { pins: 5 } },
    ]);
    db.pin.findMany.mockResolvedValue([{ imageUrl: "/a.png" }, { imageUrl: "/b.png" }]);
    const result = await searchTagResults("ar");
    expect(result).toEqual([
      { id: "t1", slug: "art", name: "Art", pinCount: 5, previewUrls: ["/a.png", "/b.png"] },
    ]);
  });
});

describe("searchTags", () => {
  it("returns an empty list for a blank query without querying", async () => {
    expect(await searchTags("  ")).toEqual([]);
    expect(db.tag.findMany).not.toHaveBeenCalled();
  });

  it("matches tags by name, case-insensitively", async () => {
    db.tag.findMany.mockResolvedValue([{ id: "t1", slug: "bikes", name: "Bikes" }]);
    expect((await searchTags("bik")).map((t) => t.name)).toEqual(["Bikes"]);
    expect(db.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { name: { contains: "bik", mode: "insensitive" } } }),
    );
  });
});
