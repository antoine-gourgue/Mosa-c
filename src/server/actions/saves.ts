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
