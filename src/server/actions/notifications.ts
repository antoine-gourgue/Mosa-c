"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AppError } from "@/server/result";

/**
 * Marks a single notification as read, scoped to the current user so a user can
 * only update their own notifications.
 *
 * @param notificationId - The id of the notification to mark as read.
 * @returns A promise that resolves once the notification has been updated.
 */
export async function markRead(notificationId: string): Promise<void> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in.");
  }
  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: user.id },
    data: { read: true },
  });
  revalidatePath("/notifications");
}

/**
 * Marks all of the current user's notifications as read.
 *
 * @returns A promise that resolves once the notifications have been updated.
 */
export async function markAllRead(): Promise<void> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in.");
  }
  await prisma.notification.updateMany({
    where: { recipientId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
