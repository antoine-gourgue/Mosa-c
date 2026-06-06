"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AppError } from "@/server/result";

/**
 * Toggles whether the current user has saved a pin, creating or deleting the
 * Save row and revalidating the feed and board.
 *
 * @param pinId - The id of the pin to save or unsave.
 * @returns The new saved state.
 */
export async function toggleSave(pinId: string): Promise<{ saved: boolean }> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to save pins.");
  }

  const key = { userId_pinId: { userId: user.id, pinId } };
  const existing = await prisma.save.findUnique({ where: key });

  if (existing === null) {
    await prisma.save.create({ data: { userId: user.id, pinId } });
  } else {
    await prisma.save.delete({ where: key });
  }

  revalidatePath("/");
  revalidatePath("/boards");
  return { saved: existing === null };
}

/**
 * Saves a pin into a specific board chosen by the current user. The default
 * Quick Saves board is backed by a Save row; other boards by a BoardPin. The
 * user must own or be an editor of the board. Saving is idempotent.
 *
 * @param pinId - The pin id.
 * @param boardId - The target board id.
 * @returns A success result, or a failure with an error message.
 */
export async function savePinToBoard(
  pinId: string,
  boardId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in to save pins." };
  }
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { isDefault: true },
  });
  if (board === null) {
    return { ok: false, error: "Board not found." };
  }
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: user.id } },
    select: { role: true },
  });
  if (member === null || member.role === "VIEWER") {
    return { ok: false, error: "You cannot save to this board." };
  }

  if (board.isDefault) {
    await prisma.save.upsert({
      where: { userId_pinId: { userId: user.id, pinId } },
      update: {},
      create: { userId: user.id, pinId },
    });
  } else {
    await prisma.boardPin.upsert({
      where: { boardId_pinId: { boardId, pinId } },
      update: {},
      create: { boardId, pinId },
    });
  }

  revalidatePath("/");
  revalidatePath("/boards");
  revalidatePath(`/boards/${boardId}`);
  return { ok: true };
}
