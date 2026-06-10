"use server";

import { getCurrentUser } from "@/lib/auth";
import { errorMessage } from "@/server/error-message";

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
    return { ok: false, error: await errorMessage("signedOut") };
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return { ok: false, error: await errorMessage("invalidUrl") };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: await errorMessage("onlyHttpLinks") };
  }
  if (isBlockedHost(parsed.hostname)) {
    return { ok: false, error: await errorMessage("hostNotAllowed") };
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
      return { ok: false, error: await errorMessage("imageFetchFailed") };
    }
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!contentType.startsWith("image/")) {
      return { ok: false, error: await errorMessage("linkNotImage") };
    }
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (declared > MAX_BYTES) {
      return { ok: false, error: await errorMessage("imageTooLarge") };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return { ok: false, error: await errorMessage("imageTooLarge") };
    }
    const name = parsed.pathname.split("/").pop()?.split("?")[0] ?? "image";
    return {
      ok: true,
      dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
      name,
    };
  } catch {
    return { ok: false, error: await errorMessage("imageFetchFailed") };
  } finally {
    clearTimeout(timer);
  }
}
