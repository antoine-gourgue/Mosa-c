"use server";

import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AppError } from "@/server/result";
import type { Board } from "@/types/domain";

const boardNameSchema = z.string().trim().min(1).max(60);

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
 * Ensures a board exists and is owned by the given user.
 *
 * @param boardId - The board id.
 * @param userId - The expected owner id.
 * @returns A promise that resolves when ownership is confirmed.
 */
async function assertBoardOwner(boardId: string, userId: string): Promise<void> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { ownerId: true },
  });
  if (board === null) {
    throw new AppError("NOT_FOUND", "Board not found.");
  }
  if (board.ownerId !== userId) {
    throw new AppError("UNAUTHORIZED", "You do not own this board.");
  }
}

/**
 * Creates a new board owned by the current user.
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
    data: { name: parsed.data, ownerId: user.id },
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
 * Adds a pin to one of the current user's boards (idempotent).
 *
 * @param pinId - The pin id.
 * @param boardId - The target board id.
 * @returns A promise that resolves when the pin is on the board.
 */
export async function addPinToBoard(pinId: string, boardId: string): Promise<void> {
  const user = await requireUser();
  await assertBoardOwner(boardId, user.id);
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
  await assertBoardOwner(boardId, user.id);
  await prisma.boardPin.delete({ where: { boardId_pinId: { boardId, pinId } } });
  revalidatePath("/boards");
}
