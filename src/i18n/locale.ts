import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * Resolves the active locale for the request, mirroring how apps like Instagram
 * pick a language: an explicit choice (cookie) wins, otherwise the browser's
 * `Accept-Language` is honoured, falling back to {@link defaultLocale}.
 *
 * @returns The locale to render the request in.
 */
export async function getUserLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (fromCookie !== undefined && isLocale(fromCookie)) {
    return fromCookie;
  }
  const accept = (await headers()).get("accept-language") ?? "";
  const preferred = accept
    .split(",")
    .map((part) => part.split(";")[0]?.trim().slice(0, 2).toLowerCase() ?? "");
  return preferred.find(isLocale) ?? defaultLocale;
}
