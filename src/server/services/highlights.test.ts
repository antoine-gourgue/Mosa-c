import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    highlight: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      delete: vi.fn(),
    },
    highlightStory: {
      count: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    story: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock("./follows", () => ({ getFollowedCreatorIds: vi.fn() }));
vi.mock("./blocks", () => ({ getHiddenUserIds: vi.fn() }));

import { prisma } from "@/lib/prisma";
import {
  addStoryToHighlight,
  createHighlight,
  deleteHighlight,
  getAddableStories,
  getHighlightDetail,
  getHighlights,
  removeStoryFromHighlight,
  renameHighlight,
} from "./highlights";

const db = prisma as unknown as {
  highlight: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    updateMany: Mock;
    deleteMany: Mock;
    delete: Mock;
  };
  highlightStory: { count: Mock; upsert: Mock; deleteMany: Mock; findMany: Mock };
  story: { findUnique: Mock; findMany: Mock };
};

const owner = (id: string) => ({
  id,
  name: id,
  username: id,
  bio: null,
  avatarUrl: null,
  followersLabel: null,
  verified: false,
  isPrivate: false,
});

const storyRow = (id: string) => ({
  id,
  mediaType: "IMAGE",
  imageUrl: `/${id}.png`,
  videoUrl: null,
  width: 1080,
  height: 1920,
  videoDurationS: null,
  createdAt: new Date(),
  expiresAt: new Date(),
  _count: { views: 0, likes: 0 },
  likes: [],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getHighlights", () => {
  it("maps each highlight's cover and story count", async () => {
    db.highlight.findMany.mockResolvedValue([
      { id: "h1", title: "Trips", coverUrl: "/c.png", _count: { stories: 4 } },
    ]);
    expect(await getHighlights("u1")).toEqual([
      { id: "h1", title: "Trips", coverUrl: "/c.png", storyCount: 4 },
    ]);
  });
});

describe("getHighlightDetail", () => {
  it("returns null when missing", async () => {
    db.highlight.findUnique.mockResolvedValue(null);
    expect(await getHighlightDetail("h1", "u1")).toBeNull();
  });

  it("maps the owner and ordered stories", async () => {
    db.highlight.findUnique.mockResolvedValue({
      id: "h1",
      title: "Trips",
      owner: owner("u1"),
      stories: [{ story: storyRow("s1") }, { story: storyRow("s2") }],
    });
    const detail = await getHighlightDetail("h1", "u1");
    expect(detail?.owner.id).toBe("u1");
    expect(detail?.stories.map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});

describe("createHighlight", () => {
  it("rejects a story the user does not own", async () => {
    db.story.findUnique.mockResolvedValue({ authorId: "someone", imageUrl: "/s.png" });
    expect(await createHighlight("u1", "Trips", "s1")).toBeNull();
    expect(db.highlight.create).not.toHaveBeenCalled();
  });

  it("creates a highlight seeded with the story", async () => {
    db.story.findUnique.mockResolvedValue({ authorId: "u1", imageUrl: "/s.png" });
    db.highlight.create.mockResolvedValue({ id: "h1" });
    expect(await createHighlight("u1", "Trips", "s1")).toBe("h1");
    const data = db.highlight.create.mock.calls[0]?.[0]?.data;
    expect(data.coverUrl).toBe("/s.png");
    expect(data.stories.create).toEqual({ storyId: "s1", order: 0 });
  });
});

describe("addStoryToHighlight", () => {
  it("rejects when the user owns neither", async () => {
    db.highlight.findUnique.mockResolvedValue({ ownerId: "other" });
    db.story.findUnique.mockResolvedValue({ authorId: "u1" });
    expect(await addStoryToHighlight("h1", "s1", "u1")).toBe(false);
  });

  it("appends the story after the last item", async () => {
    db.highlight.findUnique.mockResolvedValue({ ownerId: "u1" });
    db.story.findUnique.mockResolvedValue({ authorId: "u1" });
    db.highlightStory.count.mockResolvedValue(2);
    expect(await addStoryToHighlight("h1", "s1", "u1")).toBe(true);
    expect(db.highlightStory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { highlightId: "h1", storyId: "s1", order: 2 } }),
    );
  });
});

describe("removeStoryFromHighlight", () => {
  it("deletes the highlight once it is empty", async () => {
    db.highlight.findUnique.mockResolvedValue({ ownerId: "u1" });
    db.highlightStory.count.mockResolvedValue(0);
    expect(await removeStoryFromHighlight("h1", "s1", "u1")).toBe(true);
    expect(db.highlightStory.deleteMany).toHaveBeenCalled();
    expect(db.highlight.delete).toHaveBeenCalledWith({ where: { id: "h1" } });
  });

  it("keeps the highlight when stories remain", async () => {
    db.highlight.findUnique.mockResolvedValue({ ownerId: "u1" });
    db.highlightStory.count.mockResolvedValue(1);
    await removeStoryFromHighlight("h1", "s1", "u1");
    expect(db.highlight.delete).not.toHaveBeenCalled();
  });
});

describe("getAddableStories", () => {
  it("returns nothing when the highlight is not the user's", async () => {
    db.highlight.findUnique.mockResolvedValue({ ownerId: "other" });
    expect(await getAddableStories("h1", "u1")).toEqual([]);
    expect(db.story.findMany).not.toHaveBeenCalled();
  });

  it("excludes stories already in the highlight", async () => {
    db.highlight.findUnique.mockResolvedValue({ ownerId: "u1" });
    db.highlightStory.findMany.mockResolvedValue([{ storyId: "s1" }]);
    db.story.findMany.mockResolvedValue([storyRow("s2")]);
    const stories = await getAddableStories("h1", "u1");
    expect(stories.map((s) => s.id)).toEqual(["s2"]);
    expect(db.story.findMany.mock.calls[0]?.[0]?.where?.id).toEqual({ notIn: ["s1"] });
  });
});

describe("renameHighlight / deleteHighlight", () => {
  it("renames only the owner's highlight", async () => {
    db.highlight.updateMany.mockResolvedValue({ count: 1 });
    expect(await renameHighlight("h1", "u1", "Summer")).toBe(true);
  });

  it("deletes only the owner's highlight", async () => {
    db.highlight.deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteHighlight("h1", "intruder")).toBe(false);
  });
});
