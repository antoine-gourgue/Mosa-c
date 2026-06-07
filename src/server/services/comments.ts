import { prisma } from "@/lib/prisma";
import type { CommentReaction, PinComment } from "@/types/domain";
import { type CreatorRow, toCreator } from "./mappers";

type ReactionRow = {
  emoji: string;
  userId: string;
};

type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  author: CreatorRow;
  reactions?: ReactionRow[];
};

/**
 * Aggregates raw reaction rows into per-emoji counts, flagging the emojis the
 * viewer reacted with. Emojis are ordered by descending count, then by emoji
 * for a stable display.
 *
 * @param rows - The raw reaction rows for a comment.
 * @param viewerId - The current viewer's id, or null when signed out.
 * @returns The aggregated reactions.
 */
export function aggregateReactions(
  rows: ReactionRow[],
  viewerId: string | null,
): CommentReaction[] {
  const byEmoji = new Map<string, CommentReaction>();
  for (const row of rows) {
    const current = byEmoji.get(row.emoji) ?? {
      emoji: row.emoji,
      count: 0,
      reactedByViewer: false,
    };
    current.count += 1;
    if (row.userId === viewerId) {
      current.reactedByViewer = true;
    }
    byEmoji.set(row.emoji, current);
  }
  return [...byEmoji.values()].sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
}

/**
 * Maps a comment row to the UI comment type.
 *
 * @param row - The comment row with its author and optional reactions.
 * @param viewerId - The current viewer's id, or null when signed out.
 * @returns The mapped comment.
 */
export function toComment(row: CommentRow, viewerId: string | null = null): PinComment {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: toCreator(row.author),
    replies: [],
    reactions: aggregateReactions(row.reactions ?? [], viewerId),
  };
}

/**
 * Fetches a pin's root comments with their authors, one level of replies and
 * aggregated emoji reactions, oldest first.
 *
 * @param pinId - The pin id.
 * @param viewerId - The current viewer's id, or null when signed out.
 * @returns The pin's threaded comments.
 */
export async function getComments(
  pinId: string,
  viewerId: string | null = null,
): Promise<PinComment[]> {
  const reactionSelect = { select: { emoji: true, userId: true } } as const;
  const rows = await prisma.comment.findMany({
    where: { pinId, parentId: null },
    include: {
      author: true,
      reactions: reactionSelect,
      replies: {
        include: { author: true, reactions: reactionSelect },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => ({
    ...toComment(row, viewerId),
    replies: row.replies.map((reply) => toComment(reply, viewerId)),
  }));
}
