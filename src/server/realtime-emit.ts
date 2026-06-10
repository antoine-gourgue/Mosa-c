import { env } from "@/lib/env";

/**
 * Pushes a server-originated event to a single user's live sockets by posting to
 * the realtime service's internal emit endpoint. The event lands in the
 * `user:${userId}` room every authenticated socket joins on connection.
 *
 * Best-effort and fire-and-forget: it no-ops when the internal endpoint is not
 * configured (e.g. local development without the realtime service) and swallows
 * any transport error so a delivery failure never breaks the originating action.
 *
 * @param userId - The recipient whose sockets should receive the event.
 * @param event - The socket event name (e.g. `notification:new`).
 * @param payload - The optional event payload.
 */
export async function emitToUser(
  userId: string,
  event: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const url = env.REALTIME_INTERNAL_URL;
  const secret = env.REALTIME_INTERNAL_SECRET;
  if (url === undefined || secret === undefined) {
    return;
  }
  try {
    await fetch(`${url.replace(/\/$/, "")}/internal/emit`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-secret": secret },
      body: JSON.stringify({ room: `user:${userId}`, event, payload }),
    });
  } catch {
    return;
  }
}
