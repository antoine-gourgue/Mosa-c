import type { NotificationType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

/**
 * The notification kinds a user can toggle, in display order.
 */
export const NOTIFICATION_TYPES: NotificationType[] = [
  "FOLLOW",
  "LIKE",
  "COMMENT",
  "REPLY",
  "REACTION",
  "MENTION",
];

/**
 * A user's in-app notification preferences: whether each kind is delivered.
 */
export type NotificationPrefs = Record<NotificationType, boolean>;

/**
 * The default preferences for a user who has never changed them: every kind on.
 *
 * @returns The all-enabled preferences.
 */
export function defaultNotificationPrefs(): NotificationPrefs {
  return { FOLLOW: true, LIKE: true, COMMENT: true, REPLY: true, REACTION: true, MENTION: true };
}

/**
 * Parses a stored JSON preferences value into a complete preference map,
 * defaulting any missing or malformed entry to enabled so a new kind is opt-out
 * rather than silently dropped.
 *
 * @param raw - The raw `notifPrefs` JSON value from the database.
 * @returns The normalized preferences.
 */
export function parseNotificationPrefs(raw: unknown): NotificationPrefs {
  const prefs = defaultNotificationPrefs();
  if (raw !== null && typeof raw === "object") {
    for (const type of NOTIFICATION_TYPES) {
      const value = (raw as Record<string, unknown>)[type];
      if (typeof value === "boolean") {
        prefs[type] = value;
      }
    }
  }
  return prefs;
}

/**
 * Loads a user's normalized notification preferences.
 *
 * @param userId - The user id.
 * @returns The user's preferences, all-enabled when never set.
 */
export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifPrefs: true },
  });
  return parseNotificationPrefs(row?.notifPrefs ?? null);
}

/**
 * Whether a recipient wants in-app notifications of the given kind.
 *
 * @param userId - The recipient user id.
 * @param type - The notification kind.
 * @returns True when the recipient has the kind enabled.
 */
export async function wantsNotification(userId: string, type: NotificationType): Promise<boolean> {
  const prefs = await getNotificationPrefs(userId);
  return prefs[type];
}
