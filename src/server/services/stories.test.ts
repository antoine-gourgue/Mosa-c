import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    story: { create: vi.fn(), findMany: vi.fn() },
    storyView: { upsert: vi.fn() },
  },
}));
vi.mock("./follows", () => ({ getFollowedCreatorIds: vi.fn() }));
vi.mock("./blocks", () => ({ getHiddenUserIds: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { getHiddenUserIds } from "./blocks";
import { getFollowedCreatorIds } from "./follows";
import { createStory, getStoryReel, recordStoryView } from "./stories";

const db = prisma as unknown as {
  story: { create: Mock; findMany: Mock };
  storyView: { upsert: Mock };
};

const author = (id: string) => ({
  id,
  name: id,
  username: id,
  bio: null,
  avatarUrl: null,
  followersLabel: null,
  verified: false,
  isPrivate: false,
});

const storyRow = (id: string, authorId: string, seen: boolean, createdAt: Date) => ({
  id,
  authorId,
  mediaType: "IMAGE",
  imageUrl: `/${id}.png`,
  videoUrl: null,
  width: 1080,
  height: 1920,
  videoDurationS: null,
  createdAt,
  expiresAt: new Date(createdAt.getTime() + 86_400_000),
  author: author(authorId),
  views: seen ? [{ storyId: id }] : [],
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getFollowedCreatorIds).mockResolvedValue([]);
  vi.mocked(getHiddenUserIds).mockResolvedValue([]);
});

describe("createStory", () => {
  it("creates a story that expires ~24h out and maps it", async () => {
    db.story.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "s1",
      ...data,
    }));
    const before = Date.now();
    const story = await createStory({
      authorId: "u1",
      mediaType: "IMAGE",
      imageUrl: "/s.png",
      width: 1080,
      height: 1920,
    });
    expect(story.id).toBe("s1");
    expect(story.videoUrl).toBeNull();
    const ttl = story.expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThan(23 * 3_600_000);
    expect(ttl).toBeLessThanOrEqual(24 * 3_600_000 + 1000);
  });
});

describe("recordStoryView", () => {
  it("upserts the view on the composite key", async () => {
    await recordStoryView("s1", "u9");
    expect(db.storyView.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { storyId_viewerId: { storyId: "s1", viewerId: "u9" } } }),
    );
  });
});

describe("getStoryReel", () => {
  it("returns an empty reel and skips the query when there are no authors", async () => {
    vi.mocked(getHiddenUserIds).mockResolvedValue(["me"]);
    expect(await getStoryReel("me")).toEqual([]);
    expect(db.story.findMany).not.toHaveBeenCalled();
  });

  it("groups by author, flags unseen and puts the viewer first", async () => {
    vi.mocked(getFollowedCreatorIds).mockResolvedValue(["ada", "ben"]);
    db.story.findMany.mockResolvedValue([
      storyRow("s1", "ada", true, new Date("2026-06-19T10:00:00Z")),
      storyRow("s2", "ada", false, new Date("2026-06-19T11:00:00Z")),
      storyRow("s3", "ben", true, new Date("2026-06-19T12:00:00Z")),
      storyRow("s4", "me", false, new Date("2026-06-19T09:00:00Z")),
    ]);
    const reel = await getStoryReel("me");
    expect(reel.map((item) => item.author.id)).toEqual(["me", "ada", "ben"]);
    expect(reel[0]?.stories).toHaveLength(1);
    expect(reel[1]?.hasUnseen).toBe(true);
    expect(reel[2]?.hasUnseen).toBe(false);
  });

  it("excludes blocked authors from the query", async () => {
    vi.mocked(getFollowedCreatorIds).mockResolvedValue(["ada", "ben"]);
    vi.mocked(getHiddenUserIds).mockResolvedValue(["ben"]);
    db.story.findMany.mockResolvedValue([]);
    await getStoryReel("me");
    const where = db.story.findMany.mock.calls[0]?.[0]?.where;
    expect(where.authorId.in).toEqual(["me", "ada"]);
  });
});
