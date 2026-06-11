import { prisma } from "@/lib/prisma";
import type {
  Board,
  BoardDetail,
  BoardMemberSummary,
  BoardRole,
  BoardSummary,
} from "@/types/domain";
import { PIN_INCLUDE, toBoard, toCreator, toPin } from "./mappers";

/**
 * Prisma filter matching boards a user owns or collaborates on.
 *
 * @param userId - The user id.
 * @returns The where clause.
 */
function ownedOrMember(userId: string): {
  OR: [{ ownerId: string }, { members: { some: { userId: string } } }];
} {
  return { OR: [{ ownerId: userId }, { members: { some: { userId } } }] };
}

/**
 * Fetches the boards a user owns or collaborates on, with their pin counts.
 *
 * @param userId - The user id.
 * @returns The user's boards.
 */
export async function getBoardsForUser(userId: string): Promise<Board[]> {
  const rows = await prisma.board.findMany({
    where: ownedOrMember(userId),
    include: { _count: { select: { pins: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toBoard);
}

/**
 * Fetches a board's members with their role, owner first.
 *
 * @param boardId - The board id.
 * @returns The board members.
 */
export async function getBoardMembers(boardId: string): Promise<BoardMemberSummary[]> {
  const rows = await prisma.boardMember.findMany({
    where: { boardId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return rows
    .map((row) => ({ user: toCreator(row.user), role: row.role as BoardRole }))
    .sort((a, b) => (a.role === "OWNER" ? -1 : b.role === "OWNER" ? 1 : 0));
}

/**
 * Resolves a user's role on a board.
 *
 * @param boardId - The board id.
 * @param userId - The user id.
 * @returns The user's role, or null when they are not a member.
 */
export async function getBoardRole(boardId: string, userId: string): Promise<BoardRole | null> {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { role: true },
  });
  return member === null ? null : (member.role as BoardRole);
}

/**
 * Whether a user may edit a board (add pins, rename): its owner or an editor.
 *
 * @param boardId - The board id.
 * @param userId - The user id.
 * @returns True when the user can edit the board.
 */
export async function canEditBoard(boardId: string, userId: string): Promise<boolean> {
  const role = await getBoardRole(boardId, userId);
  return role === "OWNER" || role === "EDITOR";
}

/**
 * Whether a user may manage a board (delete, manage members): its owner only.
 *
 * @param boardId - The board id.
 * @param userId - The user id.
 * @returns True when the user owns the board.
 */
export async function canManageBoard(boardId: string, userId: string): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  });
  return board !== null && board.ownerId === userId;
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
 * Fetches a board with its owner, members, the viewer's role and pins. The
 * default board surfaces the owner's saved pins; other boards surface the pins
 * added to them.
 *
 * @param boardId - The board id.
 * @param viewerId - The viewing user's id, used to resolve their role.
 * @returns The board detail, or null when it does not exist.
 */
export async function getBoardWithPins(
  boardId: string,
  viewerId: string | null = null,
): Promise<BoardDetail | null> {
  const board = await prisma.board.findUnique({ where: { id: boardId }, include: { owner: true } });
  if (board === null) {
    return null;
  }
  const members = await getBoardMembers(boardId);
  const viewerRole =
    viewerId === null ? null : (members.find((m) => m.user.id === viewerId)?.role ?? null);
  if (board.visibility === "SECRET" && board.ownerId !== viewerId && viewerRole === null) {
    return null;
  }
  const base = {
    id: board.id,
    name: board.name,
    description: board.description,
    visibility: board.visibility,
    owner: toCreator(board.owner),
    members,
    viewerRole,
  };
  if (board.isDefault) {
    const saves = await prisma.save.findMany({
      where: { userId: board.ownerId },
      include: { pin: { include: PIN_INCLUDE } },
      orderBy: { savedAt: "desc" },
    });
    return { ...base, isDefault: true, pins: saves.map((save) => toPin(save.pin)) };
  }
  const boardPins = await prisma.boardPin.findMany({
    where: { boardId },
    include: { pin: { include: PIN_INCLUDE } },
    orderBy: { addedAt: "desc" },
  });
  return { ...base, isDefault: false, pins: boardPins.map((boardPin) => toPin(boardPin.pin)) };
}

/**
 * Resolves up to `limit` cover images for a board (its most recent pins),
 * preferring saved pins for the default board, for a collage cover.
 *
 * @param boardId - The board id.
 * @param ownerId - The board owner's id.
 * @param isDefault - Whether the board is the default Quick Saves board.
 * @param limit - The maximum number of cover images.
 * @returns The cover image URLs, newest first (possibly empty).
 */
async function boardCovers(
  boardId: string,
  ownerId: string,
  isDefault: boolean,
  limit = 3,
): Promise<string[]> {
  if (isDefault) {
    const saves = await prisma.save.findMany({
      where: { userId: ownerId },
      include: { pin: { select: { imageUrl: true } } },
      orderBy: { savedAt: "desc" },
      take: limit,
    });
    return saves.map((save) => save.pin.imageUrl);
  }
  const boardPins = await prisma.boardPin.findMany({
    where: { boardId },
    include: { pin: { select: { imageUrl: true } } },
    orderBy: { addedAt: "desc" },
    take: limit,
  });
  return boardPins.map((boardPin) => boardPin.pin.imageUrl);
}

/**
 * Fetches the boards a user owns or collaborates on with a cover image and pin
 * count, for listings. Secret boards are hidden from viewers who are neither the
 * owner nor a collaborator.
 *
 * @param userId - The user whose boards to list.
 * @param viewerId - The viewer, used to filter out secret boards (defaults to
 *   the owner, i.e. no filtering).
 * @returns The user's board summaries visible to the viewer.
 */
export async function getUserBoardsWithCovers(
  userId: string,
  viewerId: string | null = userId,
): Promise<BoardSummary[]> {
  const rows = await prisma.board.findMany({
    where: {
      AND: [
        ownedOrMember(userId),
        {
          OR: [
            { visibility: "PUBLIC" },
            ...(viewerId === null
              ? []
              : [{ ownerId: viewerId }, { members: { some: { userId: viewerId } } }]),
          ],
        },
      ],
    },
    include: { _count: { select: { pins: true } }, owner: { select: { username: true } } },
    orderBy: { createdAt: "asc" },
  });
  return Promise.all(
    rows.map(async (row) => {
      const coverUrls = await boardCovers(row.id, row.ownerId, row.isDefault);
      const count = row.isDefault
        ? await prisma.save.count({ where: { userId: row.ownerId } })
        : row._count.pins;
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        visibility: row.visibility,
        isDefault: row.isDefault,
        pinCount: count,
        coverUrls,
        ownerUsername: row.owner.username,
      };
    }),
  );
}

/**
 * Fetches the public boards the user follows with a cover image and pin count,
 * for the "Boards you follow" listing. A board that has since turned secret is
 * excluded, since only public boards remain followable.
 *
 * @param userId - The follower's user id.
 * @returns The followed board summaries, newest-followed first.
 */
export async function getFollowedBoardsWithCovers(userId: string): Promise<BoardSummary[]> {
  const follows = await prisma.boardFollow.findMany({
    where: { userId, board: { visibility: "PUBLIC" } },
    include: {
      board: {
        include: { _count: { select: { pins: true } }, owner: { select: { username: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return Promise.all(
    follows.map(async ({ board }) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      visibility: board.visibility,
      isDefault: board.isDefault,
      pinCount: board._count.pins,
      coverUrls: await boardCovers(board.id, board.ownerId, board.isDefault),
      ownerUsername: board.owner.username,
    })),
  );
}
