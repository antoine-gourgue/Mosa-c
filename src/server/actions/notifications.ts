"use server";

import { revalidatePath } from "next/cache";
import { errorMessage } from "@/server/error-message";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AppError } from "@/server/result";
import { getPendingFollowRequests } from "@/server/services/follows";
import { getNotifications } from "@/server/services/notifications";
import type { AppNotification, Creator } from "@/types/domain";

/**
 * Loads the current user's notifications and pending follow requests for the
 * rail overlay panel, fetched lazily the first time the panel is opened.
 *
 * @returns The notifications and follow requests, or an authorization error.
 */
export async function loadNotifications(): Promise<
  { ok: true; notifications: AppNotification[]; requests: Creator[] } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  const [notifications, requests] = await Promise.all([
    getNotifications(user.id),
    getPendingFollowRequests(user.id),
  ]);
  return { ok: true, notifications, requests };
}

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
    throw new AppError("UNAUTHORIZED", await errorMessage("signedOut"));
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
    throw new AppError("UNAUTHORIZED", await errorMessage("signedOut"));
  }
  await prisma.notification.updateMany({
    where: { recipientId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
