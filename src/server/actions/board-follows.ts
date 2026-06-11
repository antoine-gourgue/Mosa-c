"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AppError } from "@/server/result";

/**
 * Toggles whether the current user follows a board, creating or deleting the
 * BoardFollow row. Only public, non-default boards owned by someone else can be
 * followed; following a board surfaces its new pins in the viewer's "Following"
 * feed without following the whole creator.
 *
 * @param boardId - The id of the board to follow or unfollow.
 * @returns The new following state.
 */
export async function toggleBoardFollow(boardId: string): Promise<{ following: boolean }> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to follow boards.");
  }
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true, visibility: true, isDefault: true },
  });
  if (board === null) {
    throw new AppError("NOT_FOUND", "That board no longer exists.");
  }
  if (board.ownerId === user.id) {
    throw new AppError("VALIDATION", "You cannot follow your own board.");
  }
  if (board.visibility !== "PUBLIC" || board.isDefault) {
    throw new AppError("VALIDATION", "This board cannot be followed.");
  }

  const key = { userId_boardId: { userId: user.id, boardId } };
  const existing = await prisma.boardFollow.findUnique({ where: key });
  if (existing === null) {
    await prisma.boardFollow.create({ data: { userId: user.id, boardId } });
  } else {
    await prisma.boardFollow.delete({ where: key });
  }
  return { following: existing === null };
}
