import { prisma } from "@/lib/prisma";
import type { AppNotification, NotificationKind } from "@/types/domain";
import { type CreatorRow, toCreator } from "./mappers";

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
function buildMessage(kind: NotificationKind, actorName: string): string {
  switch (kind) {
    case "FOLLOW":
      return `${actorName} started following you`;
    case "LIKE":
      return `${actorName} liked your pin`;
    case "COMMENT":
      return `${actorName} commented on your pin`;
    case "REPLY":
      return `${actorName} replied to your comment`;
    case "REACTION":
      return `${actorName} reacted to your comment`;
    case "MENTION":
      return `${actorName} mentioned you in a comment`;
  }
}

/**
 * Maps a notification row to the UI notification type.
 *
 * @param row - The notification row with its actor and optional pin.
 * @returns The mapped notification.
 */
function toNotification(row: NotificationRow): AppNotification {
  const actor = toCreator(row.actor);
  return {
    id: row.id,
    kind: row.type,
    read: row.read,
    createdAt: row.createdAt.toISOString(),
    actor,
    pinId: row.pinId,
    pinImageUrl: row.pin?.imageUrl ?? null,
    message: buildMessage(row.type, actor.name),
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
  const rows = await prisma.notification.findMany({
    where: { recipientId: userId },
    include: { actor: true, pin: { select: { imageUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toNotification);
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
