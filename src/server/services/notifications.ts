import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import type { AppNotification, NotificationKind } from "@/types/domain";
import { getHiddenUserIds } from "./blocks";
import { type CreatorRow, toCreator } from "./mappers";

/**
 * Translator for the `notifications` namespace, used to build localized
 * notification messages from their kind and actor.
 */
type NotificationTranslator = (key: string, values: { name: string }) => string;

/**
 * Maps each notification kind to its message key in the `notifications` catalogue.
 */
const MESSAGE_KEY: Record<NotificationKind, string> = {
  FOLLOW: "follow",
  LIKE: "like",
  COMMENT: "comment",
  REPLY: "reply",
  REACTION: "reaction",
  MENTION: "mention",
};

type NotificationRow = {
  id: string;
  type: NotificationKind;
  read: boolean;
  createdAt: Date;
  actor: CreatorRow;
  pinId: string | null;
  pin: { imageUrl: string } | null;
};

/**
 * Builds the human-readable message for a notification from its kind and actor.
 *
 * @param kind - The notification kind.
 * @param actorName - The display name of the user who triggered it.
 * @returns The message text.
 */
function buildMessage(
  kind: NotificationKind,
  actorName: string,
  t: NotificationTranslator,
): string {
  return t(MESSAGE_KEY[kind], { name: actorName });
}

/**
 * Maps a notification row to the UI notification type.
 *
 * @param row - The notification row with its actor and optional pin.
 * @param t - Translator for the notification message.
 * @returns The mapped notification.
 */
function toNotification(row: NotificationRow, t: NotificationTranslator): AppNotification {
  const actor = toCreator(row.actor);
  return {
    id: row.id,
    kind: row.type,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
    actor,
    pinId: row.pinId,
    pinImageUrl: row.pin?.imageUrl ?? null,
    message: buildMessage(row.type, actor.name, t),
  };
}

/**
 * Fetches a user's notifications, newest first, with the actor and pin context
 * needed to render and link each item.
 *
 * @param userId - The recipient user id.
 * @param limit - The maximum number of notifications to return.
 * @returns The user's notifications.
 */
export async function getNotifications(userId: string, limit = 50): Promise<AppNotification[]> {
  const hidden = await getHiddenUserIds(userId);
  const rows = await prisma.notification.findMany({
    where: { recipientId: userId, ...(hidden.length > 0 ? { actorId: { notIn: hidden } } : {}) },
    include: { actor: true, pin: { select: { imageUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const t = (await getTranslations("notifications")) as unknown as NotificationTranslator;
  return rows.map((row) => toNotification(row, t));
}

/**
 * Counts a user's unread notifications.
 *
 * @param userId - The recipient user id.
 * @returns The number of unread notifications.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { recipientId: userId, read: false } });
}
