import { decode } from "next-auth/jwt";

/**
 * The Auth.js v5 session cookie names, tried in order (secure first for HTTPS).
 * The cookie name doubles as the JWT decryption salt.
 */
const COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"];

/**
 * Parses a raw Cookie header into a name→value map.
 *
 * @param header - The raw `Cookie` request header.
 * @returns The parsed cookies.
 */
function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (header === undefined) {
    return out;
  }
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) {
      continue;
    }
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key !== "") {
      out[key] = decodeURIComponent(value);
    }
  }
  return out;
}

/**
 * Resolves the authenticated user id from a request's Cookie header by decoding
 * the Auth.js session token with the shared secret. Returns null when there is
 * no valid session.
 *
 * @param header - The raw `Cookie` header from the socket handshake.
 * @param secret - The Auth.js `AUTH_SECRET`.
 * @returns The user id, or null when unauthenticated.
 */
export async function userIdFromCookieHeader(
  header: string | undefined,
  secret: string,
): Promise<string | null> {
  const cookies = parseCookies(header);
  for (const name of COOKIE_NAMES) {
    const token = cookies[name];
    if (token === undefined) {
      continue;
    }
    try {
      const decoded = await decode({ token, secret, salt: name });
      const id = (decoded as Record<string, unknown> | null)?.["id"];
      if (typeof id === "string") {
        return id;
      }
    } catch {
      continue;
    }
  }
  return null;
}
