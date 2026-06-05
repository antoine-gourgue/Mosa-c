import { prisma } from "@/lib/prisma";
import type { Board } from "@/types/domain";
import { toBoard } from "./mappers";

/**
 * Fetches the boards owned by a user with their pin counts.
 *
 * @param userId - The owner's user id.
 * @returns The user's boards.
 */
export async function getBoardsForUser(userId: string): Promise<Board[]> {
  const rows = await prisma.board.findMany({
    where: { ownerId: userId },
    include: { _count: { select: { pins: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toBoard);
}

/**
 * Fetches a user's default board.
 *
 * @param userId - The owner's user id.
 * @returns The default board, or null when none exists.
 */
export async function getDefaultBoard(userId: string): Promise<Board | null> {
  const row = await prisma.board.findFirst({
    where: { ownerId: userId, isDefault: true },
    include: { _count: { select: { pins: true } } },
  });
  return row === null ? null : toBoard(row);
}
