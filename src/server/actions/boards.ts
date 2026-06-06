"use server";

import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AppError } from "@/server/result";
import type { Board } from "@/types/domain";

const boardNameSchema = z.string().trim().min(1).max(60);
const memberRoleSchema = z.enum(["EDITOR", "VIEWER"]);

/**
 * Returns the current user or throws an unauthorized error.
 *
 * @returns The authenticated session user.
 */
async function requireUser(): Promise<NonNullable<Session["user"]>> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in.");
  }
  return user;
}

/**
 * Loads a board's owner and default flag, throwing when it does not exist.
 *
 * @param boardId - The board id.
 * @returns The board's owner id and default flag.
 */
async function getBoardOwnership(
  boardId: string,
): Promise<{ ownerId: string; isDefault: boolean }> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true, isDefault: true },
  });
  if (board === null) {
    throw new AppError("NOT_FOUND", "Board not found.");
  }
  return board;
}

/**
 * Ensures a user may edit a board (its owner or an editor member).
 *
 * @param boardId - The board id.
 * @param userId - The acting user id.
 * @returns A promise that resolves when the user can edit the board.
 */
async function assertCanEdit(boardId: string, userId: string): Promise<void> {
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
    select: { role: true },
  });
  if (member === null || member.role === "VIEWER") {
    throw new AppError("UNAUTHORIZED", "You cannot edit this board.");
  }
}

/**
 * Creates a new board owned by the current user, with an OWNER membership.
 *
 * @param name - The board name.
 * @returns The created board.
 */
export async function createBoard(name: string): Promise<Board> {
  const user = await requireUser();
  const parsed = boardNameSchema.safeParse(name);
  if (!parsed.success) {
    throw new AppError("VALIDATION", "Please enter a board name.");
  }
  const board = await prisma.board.create({
    data: {
      name: parsed.data,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
    include: { _count: { select: { pins: true } } },
  });
  revalidatePath("/boards");
  return {
    id: board.id,
    name: board.name,
    isDefault: board.isDefault,
    pinCount: board._count.pins,
  };
}

/**
 * Renames a board. Allowed for the owner or an editor.
 *
 * @param boardId - The board id.
 * @param name - The new board name.
 * @returns A promise that resolves once the board is renamed.
 */
export async function renameBoard(boardId: string, name: string): Promise<void> {
  const user = await requireUser();
  await assertCanEdit(boardId, user.id);
  const parsed = boardNameSchema.safeParse(name);
  if (!parsed.success) {
    throw new AppError("VALIDATION", "Please enter a board name.");
  }
  await prisma.board.update({ where: { id: boardId }, data: { name: parsed.data } });
  revalidatePath("/boards");
  revalidatePath(`/boards/${boardId}`);
}

/**
 * Deletes a board. Allowed for the owner only; the default Quick Saves board
 * cannot be deleted. Board pins and memberships are removed by the cascade.
 *
 * @param boardId - The board id.
 * @returns A promise that resolves once the board is deleted.
 */
export async function deleteBoard(boardId: string): Promise<void> {
  const user = await requireUser();
  const board = await getBoardOwnership(boardId);
  if (board.ownerId !== user.id) {
    throw new AppError("UNAUTHORIZED", "You do not own this board.");
  }
  if (board.isDefault) {
    throw new AppError("VALIDATION", "The default board cannot be deleted.");
  }
  await prisma.board.delete({ where: { id: boardId } });
  revalidatePath("/boards");
}

/**
 * Adds a collaborator to a board by username. Allowed for the owner only. The
 * board owner and existing members are handled idempotently; the new member's
 * role is restricted to editor or viewer.
 *
 * @param boardId - The board id.
 * @param username - The username of the user to add.
 * @param role - The role to grant (editor or viewer).
 * @returns A promise that resolves once the collaborator is added.
 */
export async function addBoardMember(
  boardId: string,
  username: string,
  role: "EDITOR" | "VIEWER",
): Promise<void> {
  const user = await requireUser();
  const board = await getBoardOwnership(boardId);
  if (board.ownerId !== user.id) {
    throw new AppError("UNAUTHORIZED", "Only the owner can manage collaborators.");
  }
  const parsedRole = memberRoleSchema.safeParse(role);
  if (!parsedRole.success) {
    throw new AppError("VALIDATION", "Invalid role.");
  }
  const handle = username.trim().replace(/^@/, "");
  const target = await prisma.user.findUnique({
    where: { username: handle },
    select: { id: true },
  });
  if (target === null) {
    throw new AppError("NOT_FOUND", "No user with that username.");
  }
  if (target.id === board.ownerId) {
    throw new AppError("VALIDATION", "The owner is already on this board.");
  }
  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId, userId: target.id } },
    update: { role: parsedRole.data },
    create: { boardId, userId: target.id, role: parsedRole.data },
  });
  revalidatePath(`/boards/${boardId}`);
}

/**
 * Removes a collaborator from a board. Allowed for the owner only; the owner
 * cannot be removed.
 *
 * @param boardId - The board id.
 * @param userId - The collaborator's user id.
 * @returns A promise that resolves once the collaborator is removed.
 */
export async function removeBoardMember(boardId: string, userId: string): Promise<void> {
  const user = await requireUser();
  const board = await getBoardOwnership(boardId);
  if (board.ownerId !== user.id) {
    throw new AppError("UNAUTHORIZED", "Only the owner can manage collaborators.");
  }
  if (userId === board.ownerId) {
    throw new AppError("VALIDATION", "The owner cannot be removed.");
  }
  await prisma.boardMember.deleteMany({ where: { boardId, userId } });
  revalidatePath(`/boards/${boardId}`);
}

/**
 * Removes the current user from a board they collaborate on. The owner cannot
 * leave their own board.
 *
 * @param boardId - The board id.
 * @returns A promise that resolves once the user has left the board.
 */
export async function leaveBoard(boardId: string): Promise<void> {
  const user = await requireUser();
  const board = await getBoardOwnership(boardId);
  if (board.ownerId === user.id) {
    throw new AppError("VALIDATION", "The owner cannot leave their own board.");
  }
  await prisma.boardMember.deleteMany({ where: { boardId, userId: user.id } });
  revalidatePath("/boards");
}

/**
 * Adds a pin to one of the current user's boards (idempotent).
 *
 * @param pinId - The pin id.
 * @param boardId - The target board id.
 * @returns A promise that resolves when the pin is on the board.
 */
export async function addPinToBoard(pinId: string, boardId: string): Promise<void> {
  const user = await requireUser();
  await assertCanEdit(boardId, user.id);
  await prisma.boardPin.upsert({
    where: { boardId_pinId: { boardId, pinId } },
    update: {},
    create: { boardId, pinId },
  });
  revalidatePath("/boards");
}

/**
 * Removes a pin from one of the current user's boards.
 *
 * @param pinId - The pin id.
 * @param boardId - The board id.
 * @returns A promise that resolves when the pin is removed.
 */
export async function removePinFromBoard(pinId: string, boardId: string): Promise<void> {
  const user = await requireUser();
  await assertCanEdit(boardId, user.id);
  await prisma.boardPin.delete({ where: { boardId_pinId: { boardId, pinId } } });
  revalidatePath("/boards");
}
