import { prisma } from "@/lib/prisma";
import type { Creator, Story, StoryReelItem, StoryViewerEntry } from "@/types/domain";
import { getHiddenUserIds } from "./blocks";
import { getFollowedCreatorIds } from "./follows";
import { toCreator } from "./mappers";

/** How long a story stays visible after it is posted. */
const STORY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Structural shape of a story row read from the database.
 */
type StoryRow = {
  id: string;
  mediaType: Story["mediaType"];
  imageUrl: string;
  videoUrl: string | null;
  width: number;
  height: number;
  videoDurationS: number | null;
  createdAt: Date;
  expiresAt: Date;
  _count?: { views: number; likes: number };
  likes?: { storyId: string }[];
};

/**
 * Maps a story row to the UI story type. Engagement counts default to zero when
 * the row was read without them (e.g. straight after creation).
 *
 * @param row - The story row.
 * @returns The mapped story.
 */
function toStory(row: StoryRow): Story {
  return {
    id: row.id,
    mediaType: row.mediaType,
    imageUrl: row.imageUrl,
    videoUrl: row.videoUrl,
    width: row.width,
    height: row.height,
    videoDurationS: row.videoDurationS,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    likeCount: row._count?.likes ?? 0,
    viewerCount: row._count?.views ?? 0,
    likedByViewer: (row.likes?.length ?? 0) > 0,
  };
}

/**
 * Input for {@link createStory}.
 */
export type CreateStoryInput = {
  authorId: string;
  mediaType: Story["mediaType"];
  imageUrl: string;
  videoUrl?: string | null;
  width: number;
  height: number;
  videoDurationS?: number | null;
};

/**
 * Posts a story that expires 24h from now.
 *
 * @param input - The author and stored media.
 * @returns The created story.
 */
export async function createStory(input: CreateStoryInput): Promise<Story> {
  const story = await prisma.story.create({
    data: {
      authorId: input.authorId,
      mediaType: input.mediaType,
      imageUrl: input.imageUrl,
      videoUrl: input.videoUrl ?? null,
      width: input.width,
      height: input.height,
      videoDurationS: input.videoDurationS ?? null,
      expiresAt: new Date(Date.now() + STORY_TTL_MS),
    },
  });
  return toStory(story);
}

/**
 * Records (idempotently) that a viewer has seen a story segment.
 *
 * @param storyId - The story segment id.
 * @param viewerId - The viewer's user id.
 * @returns A promise that resolves once the view is recorded.
 */
export async function recordStoryView(storyId: string, viewerId: string): Promise<void> {
  await prisma.storyView.upsert({
    where: { storyId_viewerId: { storyId, viewerId } },
    update: {},
    create: { storyId, viewerId },
  });
}

/**
 * Builds the feed story reel for a viewer: the active stories of the people
 * they follow plus their own, grouped by author with an unseen flag. Blocked
 * users are excluded. The viewer's own ring comes first, then authors with
 * unseen stories, then the rest — each ordered by their most recent segment.
 *
 * @param viewerId - The current viewer id.
 * @returns The grouped story reel.
 */
export async function getStoryReel(viewerId: string): Promise<StoryReelItem[]> {
  const [followedIds, hidden] = await Promise.all([
    getFollowedCreatorIds(viewerId),
    getHiddenUserIds(viewerId),
  ]);
  const hiddenSet = new Set(hidden);
  const authorIds = Array.from(new Set([viewerId, ...followedIds])).filter(
    (id) => !hiddenSet.has(id),
  );
  if (authorIds.length === 0) {
    return [];
  }

  const rows = await prisma.story.findMany({
    where: { authorId: { in: authorIds }, expiresAt: { gt: new Date() } },
    include: {
      author: true,
      views: { where: { viewerId }, select: { storyId: true } },
      likes: { where: { userId: viewerId }, select: { storyId: true } },
      _count: { select: { views: true, likes: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  type Grouped = { authorId: string; author: Creator; stories: Story[]; hasUnseen: boolean };
  const byAuthor = new Map<string, Grouped>();
  for (const row of rows) {
    const entry = byAuthor.get(row.authorId) ?? {
      authorId: row.authorId,
      author: toCreator(row.author),
      stories: [],
      hasUnseen: false,
    };
    entry.stories.push(toStory(row));
    if (row.views.length === 0) {
      entry.hasUnseen = true;
    }
    byAuthor.set(row.authorId, entry);
  }

  const latest = (stories: Story[]): number =>
    stories.reduce((max, story) => Math.max(max, story.createdAt.getTime()), 0);

  return Array.from(byAuthor.values())
    .sort((a, b) => {
      if (a.authorId === viewerId) {
        return -1;
      }
      if (b.authorId === viewerId) {
        return 1;
      }
      if (a.hasUnseen !== b.hasUnseen) {
        return a.hasUnseen ? -1 : 1;
      }
      return latest(b.stories) - latest(a.stories);
    })
    .map(({ author, stories, hasUnseen }) => ({ author, stories, hasUnseen }));
}

/**
 * Toggles the viewer's like on a story.
 *
 * @param storyId - The story id.
 * @param userId - The viewer's user id.
 * @returns The new like state and total like count.
 */
export async function toggleStoryLike(
  storyId: string,
  userId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const existing = await prisma.storyLike.findUnique({
    where: { storyId_userId: { storyId, userId } },
  });
  if (existing === null) {
    await prisma.storyLike.create({ data: { storyId, userId } });
  } else {
    await prisma.storyLike.delete({ where: { storyId_userId: { storyId, userId } } });
  }
  const likeCount = await prisma.storyLike.count({ where: { storyId } });
  return { liked: existing === null, likeCount };
}

/**
 * Deletes a story, but only when the requester is its author.
 *
 * @param storyId - The story id.
 * @param userId - The requester's user id.
 * @returns True when a story was deleted.
 */
export async function deleteStory(storyId: string, userId: string): Promise<boolean> {
  const result = await prisma.story.deleteMany({ where: { id: storyId, authorId: userId } });
  return result.count > 0;
}

/**
 * Lists who viewed a story — newest first, with whether each liked it — but only
 * for the story's author. Returns an empty list for anyone else.
 *
 * @param storyId - The story id.
 * @param requesterId - The requesting user id (must be the author).
 * @returns The viewer entries, or an empty list.
 */
export async function getStoryViewers(
  storyId: string,
  requesterId: string,
): Promise<StoryViewerEntry[]> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { authorId: true },
  });
  if (story === null || story.authorId !== requesterId) {
    return [];
  }
  const [views, likes] = await Promise.all([
    prisma.storyView.findMany({
      where: { storyId },
      include: { viewer: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.storyLike.findMany({ where: { storyId }, select: { userId: true } }),
  ]);
  const likedSet = new Set(likes.map((like) => like.userId));
  return views.map((view) => ({
    creator: toCreator(view.viewer),
    liked: likedSet.has(view.viewerId),
  }));
}
