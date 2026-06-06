import type { NotificationType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

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
 * users are never notified about their own actions. For follows and likes a
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

  if (type === "FOLLOW" || type === "LIKE") {
    const existing = await prisma.notification.findFirst({
      where: { type, recipientId, actorId, pinId: pinId ?? null, read: false },
      select: { id: true },
    });
    if (existing !== null) {
      return;
    }
  }

  await prisma.notification.create({
    data: { type, recipientId, actorId, pinId, commentId },
  });
}
