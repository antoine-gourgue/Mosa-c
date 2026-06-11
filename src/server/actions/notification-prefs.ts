"use server";

import type { NotificationType } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorMessage } from "@/server/error-message";
import {
  getNotificationPrefs,
  NOTIFICATION_TYPES,
  type NotificationPrefs,
} from "@/server/services/notification-prefs";

/**
 * Outcome of {@link updateNotificationPref}.
 */
export type UpdateNotifPrefResult = { ok: true } | { ok: false; error: string };

/**
 * Toggles whether the current user receives in-app notifications of a given
 * kind, merging the change into their stored preferences.
 *
 * @param type - The notification kind to toggle.
 * @param enabled - Whether the kind should be delivered.
 * @returns Whether the update succeeded.
 */
export async function updateNotificationPref(
  type: NotificationType,
  enabled: boolean,
): Promise<UpdateNotifPrefResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  if (!NOTIFICATION_TYPES.includes(type)) {
    return { ok: false, error: await errorMessage("checkForm") };
  }
  const current = await getNotificationPrefs(user.id);
  const next: NotificationPrefs = { ...current, [type]: enabled };
  await prisma.user.update({ where: { id: user.id }, data: { notifPrefs: next } });
  revalidatePath("/settings/notifications");
  return { ok: true };
}

/**
 * Replaces the current user's in-app notification preferences in one write,
 * sanitised to the known kinds (an unknown key is dropped, a missing kind
 * defaults to enabled). Backs the batched Save action of the settings form.
 *
 * @param prefs - The full preference map to store.
 * @returns Whether the update succeeded.
 */
export async function updateNotificationPrefs(
  prefs: NotificationPrefs,
): Promise<UpdateNotifPrefResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  const next = {} as NotificationPrefs;
  for (const type of NOTIFICATION_TYPES) {
    next[type] = prefs[type] !== false;
  }
  await prisma.user.update({ where: { id: user.id }, data: { notifPrefs: next } });
  revalidatePath("/settings/notifications");
  return { ok: true };
}
