import webpush from "web-push";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * The payload delivered to the service worker's `push` handler.
 */
export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

let vapidReady = false;

/**
 * Whether Web Push is configured (VAPID keys present). Used to gate the opt-in
 * UI and to no-op delivery in environments without keys.
 *
 * @returns True when both VAPID keys are set.
 */
export function pushConfigured(): boolean {
  return env.VAPID_PUBLIC_KEY !== undefined && env.VAPID_PRIVATE_KEY !== undefined;
}

/**
 * Lazily applies the VAPID details to web-push on first use.
 *
 * @returns True when web-push is configured and ready to send.
 */
function ensureVapid(): boolean {
  if (env.VAPID_PUBLIC_KEY === undefined || env.VAPID_PRIVATE_KEY === undefined) {
    return false;
  }
  if (!vapidReady) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT ?? "mailto:notifications@mosaic.app",
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );
    vapidReady = true;
  }
  return true;
}

/**
 * Sends a push notification to every registered device of a user, fanning out
 * over their subscriptions. Subscriptions the push service reports as gone (404
 * or 410) are deleted so dead endpoints do not accumulate. Best-effort: a single
 * failed endpoint never throws to the caller.
 *
 * @param userId - The recipient user id.
 * @param payload - The notification payload.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureVapid()) {
    return;
  }
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) {
    return;
  }
  const body = JSON.stringify(payload);
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          body,
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription
            .delete({ where: { endpoint: subscription.endpoint } })
            .catch(() => undefined);
        }
      }
    }),
  );
}
