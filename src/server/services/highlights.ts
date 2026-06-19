import { prisma } from "@/lib/prisma";
import type { Highlight, HighlightDetail, Story } from "@/types/domain";
import { toCreator } from "./mappers";
import { toStory } from "./stories";

/** Prisma include selecting a story with the viewer's like state and counts. */
const storyInclude = (viewerId: string) =>
  ({
    likes: { where: { userId: viewerId }, select: { storyId: true } },
    _count: { select: { views: true, likes: true } },
  }) as const;

/**
 * Lists an owner's highlights, newest first, with each cover and story count.
 *
 * @param ownerId - The profile owner's user id.
 * @returns The highlights.
 */
export async function getHighlights(ownerId: string): Promise<Highlight[]> {
  const rows = await prisma.highlight.findMany({
    where: { ownerId },
    include: { _count: { select: { stories: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    coverUrl: row.coverUrl,
    storyCount: row._count.stories,
  }));
}

/**
 * Loads a highlight with its ordered stories for playback, or null when it does
 * not exist.
 *
 * @param highlightId - The highlight id.
 * @param viewerId - The current viewer id (for per-story like state).
 * @returns The highlight detail, or null.
 */
export async function getHighlightDetail(
  highlightId: string,
  viewerId: string,
): Promise<HighlightDetail | null> {
  const highlight = await prisma.highlight.findUnique({
    where: { id: highlightId },
    include: {
      owner: true,
      stories: {
        orderBy: { order: "asc" },
        include: { story: { include: storyInclude(viewerId) } },
      },
    },
  });
  if (highlight === null) {
    return null;
  }
  return {
    id: highlight.id,
    title: highlight.title,
    owner: toCreator(highlight.owner),
    stories: highlight.stories.map((entry) => toStory(entry.story)),
  };
}

/**
 * Creates a highlight from a story the user owns, using the story poster as the
 * cover, and adds the story as its first item.
 *
 * @param ownerId - The owner's user id.
 * @param title - The highlight title.
 * @param storyId - The story to seed it with.
 * @returns The created highlight id, or null when the story is not the user's.
 */
export async function createHighlight(
  ownerId: string,
  title: string,
  storyId: string,
): Promise<string | null> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { authorId: true, imageUrl: true },
  });
  if (story === null || story.authorId !== ownerId) {
    return null;
  }
  const highlight = await prisma.highlight.create({
    data: {
      ownerId,
      title: title.trim().slice(0, 40) || "Highlights",
      coverUrl: story.imageUrl,
      stories: { create: { storyId, order: 0 } },
    },
  });
  return highlight.id;
}

/**
 * Lists the owner's currently active stories that are not yet in the given
 * highlight, newest first — the candidates for "add a story". Returns an empty
 * list when the highlight is not the owner's.
 *
 * @param highlightId - The target highlight id.
 * @param ownerId - The owner's user id.
 * @returns The addable stories.
 */
export async function getAddableStories(highlightId: string, ownerId: string): Promise<Story[]> {
  const highlight = await prisma.highlight.findUnique({
    where: { id: highlightId },
    select: { ownerId: true },
  });
  if (highlight === null || highlight.ownerId !== ownerId) {
    return [];
  }
  const existing = await prisma.highlightStory.findMany({
    where: { highlightId },
    select: { storyId: true },
  });
  const excluded = existing.map((entry) => entry.storyId);
  const rows = await prisma.story.findMany({
    where: {
      authorId: ownerId,
      expiresAt: { gt: new Date() },
      id: { notIn: excluded },
    },
    include: storyInclude(ownerId),
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => toStory(row));
}

/**
 * Adds a story the user owns to one of their highlights (idempotent), appended
 * after the last item.
 *
 * @param highlightId - The target highlight id.
 * @param storyId - The story to add.
 * @param ownerId - The requester's user id (must own both).
 * @returns True when added or already present, false when not allowed.
 */
export async function addStoryToHighlight(
  highlightId: string,
  storyId: string,
  ownerId: string,
): Promise<boolean> {
  const [highlight, story] = await Promise.all([
    prisma.highlight.findUnique({ where: { id: highlightId }, select: { ownerId: true } }),
    prisma.story.findUnique({ where: { id: storyId }, select: { authorId: true } }),
  ]);
  if (highlight === null || highlight.ownerId !== ownerId || story?.authorId !== ownerId) {
    return false;
  }
  const count = await prisma.highlightStory.count({ where: { highlightId } });
  await prisma.highlightStory.upsert({
    where: { highlightId_storyId: { highlightId, storyId } },
    update: {},
    create: { highlightId, storyId, order: count },
  });
  return true;
}

/**
 * Removes a story from a highlight, deleting the highlight when it becomes
 * empty. Owner-only.
 *
 * @param highlightId - The highlight id.
 * @param storyId - The story to remove.
 * @param ownerId - The requester's user id.
 * @returns True when the change was applied.
 */
export async function removeStoryFromHighlight(
  highlightId: string,
  storyId: string,
  ownerId: string,
): Promise<boolean> {
  const highlight = await prisma.highlight.findUnique({
    where: { id: highlightId },
    select: { ownerId: true },
  });
  if (highlight === null || highlight.ownerId !== ownerId) {
    return false;
  }
  await prisma.highlightStory.deleteMany({ where: { highlightId, storyId } });
  const remaining = await prisma.highlightStory.count({ where: { highlightId } });
  if (remaining === 0) {
    await prisma.highlight.delete({ where: { id: highlightId } });
  }
  return true;
}

/**
 * Renames a highlight. Owner-only.
 *
 * @param highlightId - The highlight id.
 * @param ownerId - The requester's user id.
 * @param title - The new title.
 * @returns True when renamed.
 */
export async function renameHighlight(
  highlightId: string,
  ownerId: string,
  title: string,
): Promise<boolean> {
  const result = await prisma.highlight.updateMany({
    where: { id: highlightId, ownerId },
    data: { title: title.trim().slice(0, 40) || "Highlights" },
  });
  return result.count > 0;
}

/**
 * Deletes a highlight (not the underlying stories). Owner-only.
 *
 * @param highlightId - The highlight id.
 * @param ownerId - The requester's user id.
 * @returns True when deleted.
 */
export async function deleteHighlight(highlightId: string, ownerId: string): Promise<boolean> {
  const result = await prisma.highlight.deleteMany({ where: { id: highlightId, ownerId } });
  return result.count > 0;
}
