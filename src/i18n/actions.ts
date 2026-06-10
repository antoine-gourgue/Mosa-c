"use server";

import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * Persists an explicit language choice in a long-lived cookie so subsequent
 * requests render in it. Invalid values are ignored. The cookie is read only on
 * the server, so it is `httpOnly`, and `secure` over HTTPS in production.
 *
 * @param locale - The locale the user selected.
 */
export async function setLocale(locale: Locale): Promise<void> {
  if (!isLocale(locale)) {
    return;
  }
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
  });
}
