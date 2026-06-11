import { env } from "@/lib/env";
import { sendPushToUser } from "@/server/push";
import type { PushPayload } from "@/server/push";

/**
 * Internal endpoint the realtime service calls to fan a message push out to a
 * conversation's recipients, centralising all Web Push delivery in the web
 * process (which holds the VAPID keys). Authenticated with the shared
 * `REALTIME_INTERNAL_SECRET`; never exposed publicly.
 *
 * @param request - The POST request with `{ userIds, payload }`.
 * @returns 204 on success, 400 on a bad body, 401 when the secret is missing or
 *   wrong.
 */
export async function POST(request: Request): Promise<Response> {
  const secret = env.REALTIME_INTERNAL_SECRET;
  if (secret === undefined || request.headers.get("x-internal-secret") !== secret) {
    return new Response(null, { status: 401 });
  }
  const data = (await request.json().catch(() => null)) as {
    userIds?: unknown;
    payload?: unknown;
  } | null;
  const userIds = Array.isArray(data?.userIds)
    ? data.userIds.filter((id): id is string => typeof id === "string")
    : [];
  const payload = data?.payload;
  if (payload === undefined || payload === null || typeof payload !== "object") {
    return new Response(null, { status: 400 });
  }
  await Promise.all(userIds.map((userId) => sendPushToUser(userId, payload as PushPayload)));
  return new Response(null, { status: 204 });
}
