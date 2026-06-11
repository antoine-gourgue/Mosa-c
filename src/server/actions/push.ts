"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendPushToUser } from "@/server/push";

/**
 * The result shape shared by the push actions.
 */
export type PushResult = { ok: true } | { ok: false };

/**
 * The browser PushSubscription shape (its JSON form) the client sends.
 */
export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/**
 * Stores (or refreshes) a device's push subscription for the current user,
 * keyed by its unique endpoint so re-subscribing the same device updates rather
 * than duplicates.
 *
 * @param subscription - The browser push subscription.
 * @returns Whether the subscription was saved.
 */
export async function savePushSubscription(
  subscription: PushSubscriptionInput,
): Promise<PushResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false };
  }
  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof auth !== "string" ||
    endpoint === ""
  ) {
    return { ok: false };
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: user.id, p256dh, auth },
    create: { userId: user.id, endpoint, p256dh, auth },
  });
  return { ok: true };
}

/**
 * Removes a device's push subscription, scoped to the current user so a user can
 * only unsubscribe their own devices.
 *
 * @param endpoint - The subscription endpoint to remove.
 * @returns Whether the subscription was removed.
 */
export async function deletePushSubscription(endpoint: string): Promise<PushResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false };
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return { ok: true };
}

/**
 * Sends a test push to the current user's devices, so they can confirm opt-in
 * works end-to-end from settings.
 *
 * @returns Whether the test was dispatched.
 */
export async function sendTestPush(): Promise<PushResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false };
  }
  await sendPushToUser(user.id, {
    title: "Mosaic",
    body: "Push notifications are on.",
    url: "/notifications",
    tag: "test",
  });
  return { ok: true };
}
