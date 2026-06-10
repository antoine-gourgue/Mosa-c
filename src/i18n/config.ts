/**
 * The locales the application ships translations for. `en` is the fallback.
 */
export const locales = ["en", "fr"] as const;

/**
 * A supported locale code.
 */
export type Locale = (typeof locales)[number];

/**
 * The locale used when none can be resolved from the cookie or request headers.
 */
export const defaultLocale: Locale = "en";

/**
 * The cookie that stores an explicit language choice, read on every request.
 */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Narrows an arbitrary string to a supported {@link Locale}.
 *
 * @param value - The candidate locale code.
 * @returns True when the value is a supported locale.
 */
export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
