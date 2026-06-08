"use server";

import { getCurrentUser } from "@/lib/auth";

const MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Rejects hosts that should never be fetched server-side (loopback, private and
 * link-local ranges) as a basic SSRF guard.
 *
 * @param host - The URL hostname.
 * @returns Whether the host is blocked.
 */
function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h === "0.0.0.0" || h === "::1" || h.endsWith(".local")) {
    return true;
  }
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h)) {
    return true;
  }
  return /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}

/**
 * Fetches a remote image on the server (so it is not subject to browser CORS)
 * and returns it as a data URL the client can turn into a file. Restricted to
 * signed-in users, http(s) URLs and image content under the size limit, with a
 * timeout and a basic block on private/loopback hosts.
 *
 * @param url - The remote image URL.
 * @returns The image as a data URL and a derived file name, or an error.
 */
export async function importImageFromUrl(
  url: string,
): Promise<{ ok: true; dataUrl: string; name: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { ok: false, error: "Enter a valid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https links are supported." };
  }
  if (isBlockedHost(parsed.hostname)) {
    return { ok: false, error: "That host isn't allowed." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; MosaicBot/1.0)" },
    });
    if (!response.ok) {
      return { ok: false, error: "Couldn't fetch that image." };
    }
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!contentType.startsWith("image/")) {
      return { ok: false, error: "That link doesn't point to an image." };
    }
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > MAX_BYTES) {
      return { ok: false, error: "Image is larger than 10 MB." };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return { ok: false, error: "Image is larger than 10 MB." };
    }
    const name = parsed.pathname.split("/").pop()?.split("?")[0] ?? "image";
    return {
      ok: true,
      dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
      name,
    };
  } catch {
    return { ok: false, error: "Couldn't fetch that image." };
  } finally {
    clearTimeout(timer);
  }
}
