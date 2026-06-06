import { prisma } from "@/lib/prisma";
import type { Board, BoardDetail, BoardSummary } from "@/types/domain";
import { PIN_INCLUDE, toBoard, toCreator, toPin } from "./mappers";

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

/**
 * Fetches a board with its owner and pins. The default board surfaces the
 * owner's saved pins; other boards surface the pins added to them.
 *
 * @param boardId - The board id.
 * @returns The board detail, or null when it does not exist.
 */
export async function getBoardWithPins(boardId: string): Promise<BoardDetail | null> {
  const board = await prisma.board.findUnique({ where: { id: boardId }, include: { owner: true } });
  if (board === null) {
    return null;
  }
  if (board.isDefault) {
    const saves = await prisma.save.findMany({
      where: { userId: board.ownerId },
      include: { pin: { include: PIN_INCLUDE } },
      orderBy: { savedAt: "desc" },
    });
    return {
      id: board.id,
      name: board.name,
      isDefault: true,
      owner: toCreator(board.owner),
      pins: saves.map((save) => toPin(save.pin)),
    };
  }
  const boardPins = await prisma.boardPin.findMany({
    where: { boardId },
    include: { pin: { include: PIN_INCLUDE } },
    orderBy: { addedAt: "desc" },
  });
  return {
    id: board.id,
    name: board.name,
    isDefault: false,
    owner: toCreator(board.owner),
    pins: boardPins.map((boardPin) => toPin(boardPin.pin)),
  };
}

/**
 * Resolves the cover image for a board (its most recent pin), preferring saved
 * pins for the default board.
 *
 * @param boardId - The board id.
 * @param ownerId - The board owner's id.
 * @param isDefault - Whether the board is the default Quick Saves board.
 * @returns The cover image URL, or null when the board is empty.
 */
async function boardCover(
  boardId: string,
  ownerId: string,
  isDefault: boolean,
): Promise<string | null> {
  if (isDefault) {
    const save = await prisma.save.findFirst({
      where: { userId: ownerId },
      include: { pin: { select: { imageUrl: true } } },
      orderBy: { savedAt: "desc" },
    });
    return save?.pin.imageUrl ?? null;
  }
  const boardPin = await prisma.boardPin.findFirst({
    where: { boardId },
    include: { pin: { select: { imageUrl: true } } },
    orderBy: { addedAt: "desc" },
  });
  return boardPin?.pin.imageUrl ?? null;
}

/**
 * Fetches a user's boards with a cover image and pin count, for listings.
 *
 * @param userId - The owner's user id.
 * @param ownerUsername - The owner's username, for links.
 * @returns The user's board summaries.
 */
export async function getUserBoardsWithCovers(
  userId: string,
  ownerUsername: string | null,
): Promise<BoardSummary[]> {
  const rows = await prisma.board.findMany({
    where: { ownerId: userId },
    include: { _count: { select: { pins: true } } },
    orderBy: { createdAt: "asc" },
  });
  return Promise.all(
    rows.map(async (row) => {
      const coverUrl = await boardCover(row.id, userId, row.isDefault);
      const count = row.isDefault
        ? await prisma.save.count({ where: { userId } })
        : row._count.pins;
      return {
        id: row.id,
        name: row.name,
        isDefault: row.isDefault,
        pinCount: count,
        coverUrl,
        ownerUsername,
      };
    }),
  );
}
