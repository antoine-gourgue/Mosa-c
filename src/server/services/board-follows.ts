import { prisma } from "@/lib/prisma";

/**
 * Fetches the ids of the boards a user follows.
 *
 * @param userId - The follower's user id.
 * @returns The followed board ids.
 */
export async function getFollowedBoardIds(userId: string): Promise<string[]> {
  const rows = await prisma.boardFollow.findMany({
    where: { userId },
    select: { boardId: true },
  });
  return rows.map((row) => row.boardId);
}

/**
 * Checks whether a user follows a board.
 *
 * @param userId - The follower's user id.
 * @param boardId - The board id.
 * @returns True when the user follows the board.
 */
export async function isFollowingBoard(userId: string, boardId: string): Promise<boolean> {
  const row = await prisma.boardFollow.findUnique({
    where: { userId_boardId: { userId, boardId } },
  });
  return row !== null;
}
