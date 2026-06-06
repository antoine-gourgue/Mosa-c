"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AppError } from "@/server/result";

/**
 * Toggles whether the current user likes a pin, creating or deleting the Like
 * row, and returns the new state and like count.
 *
 * @param pinId - The pin id.
 * @returns The new liked state and the updated like count.
 */
export async function toggleLike(pinId: string): Promise<{ liked: boolean; count: number }> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to like pins.");
  }

  const key = { userId_pinId: { userId: user.id, pinId } };
  const existing = await prisma.like.findUnique({ where: key });

  if (existing === null) {
    await prisma.like.create({ data: { userId: user.id, pinId } });
  } else {
    await prisma.like.delete({ where: key });
  }

  const count = await prisma.like.count({ where: { pinId } });
  revalidatePath(`/pin/${pinId}`);
  revalidatePath("/");
  return { liked: existing === null, count };
}
