import type { NotificationType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/server/push";
import { emitToUser } from "@/server/realtime-emit";
import { wantsNotification } from "@/server/services/notification-prefs";

/**
 * Builds the English push-notification body for a kind, completed with the
 * actor's name. In-app messages are localized at render time; the push body is
 * kept simple.
 *
 * @param type - The notification kind.
 * @param name - The actor's display name.
 * @returns The push body text.
 */
function pushBody(type: NotificationType, name: string): string {
  switch (type) {
    case "FOLLOW":
      return `${name} started following you`;
    case "LIKE":
      return `${name} liked your pin`;
    case "COMMENT":
      return `${name} commented on your pin`;
    case "REPLY":
      return `${name} replied to your comment`;
    case "REACTION":
      return `${name} reacted to your comment`;
    case "MENTION":
      return `${name} mentioned you`;
  }
}

/**
 * Sends a push notification for a freshly created notification, resolving the
 * actor's name and a destination link. Best-effort and self-contained so a push
 * failure never affects the notification write.
 *
 * @param type - The notification kind.
 * @param actorId - The user who triggered it.
 * @param recipientId - The recipient.
 * @param pinId - The related pin, when any.
 */
async function pushForNotification(
  type: NotificationType,
  actorId: string,
  recipientId: string,
  pinId?: string,
): Promise<void> {
  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { name: true } });
  if (actor === null) {
    return;
  }
  await sendPushToUser(recipientId, {
    title: "Mosaic",
    body: pushBody(type, actor.name),
    url: pinId !== undefined ? `/pin/${pinId}` : "/notifications",
    tag: `${type}:${actorId}`,
  });
}

/**
 * Input for {@link createNotification}.
 */
export type CreateNotificationInput = {
  type: NotificationType;
  recipientId: string;
  actorId: string;
  pinId?: string;
  commentId?: string;
};

/**
 * Creates a notification for an engagement event (follow, like or comment).
 *
 * Self-directed notifications (where the actor is the recipient) are skipped so
 * users are never notified about their own actions, as are kinds the recipient
 * has turned off in their notification preferences. For follows and likes a
 * duplicate unread notification from the same actor on the same target is
 * collapsed to avoid spamming the inbox when a relationship is toggled
 * repeatedly.
 *
 * @param input - The notification details.
 * @returns A promise that resolves once the notification has been handled.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const { type, recipientId, actorId, pinId, commentId } = input;
  if (recipientId === actorId) {
    return;
  }

  if (!(await wantsNotification(recipientId, type))) {
    return;
  }

  if (type === "FOLLOW" || type === "LIKE") {
    const existing = await prisma.notification.findFirst({
      where: { type, recipientId, actorId, pinId: pinId ?? null, read: false },
      select: { id: true },
    });
    if (existing !== null) {
      return;
    }
  }

  const created = await prisma.notification.create({
    data: { type, recipientId, actorId, pinId, commentId },
  });
  await emitToUser(recipientId, "notification:new", { id: created.id });
  await pushForNotification(type, actorId, recipientId, pinId);
}
