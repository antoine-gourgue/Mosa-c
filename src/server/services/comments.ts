import { prisma } from "@/lib/prisma";
import type { PinComment } from "@/types/domain";
import { type CreatorRow, toCreator } from "./mappers";

type CommentRow = {
  id: string;
  body: string;
  createdAt: Date;
  author: CreatorRow;
};

/**
 * Maps a comment row to the UI comment type.
 *
 * @param row - The comment row with its author.
 * @returns The mapped comment.
 */
export function toComment(row: CommentRow): PinComment {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: toCreator(row.author),
  };
}

/**
 * Fetches the comments on a pin with their authors, oldest first.
 *
 * @param pinId - The pin id.
 * @returns The pin's comments.
 */
export async function getComments(pinId: string): Promise<PinComment[]> {
  const rows = await prisma.comment.findMany({
    where: { pinId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toComment);
}
