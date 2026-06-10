/**
 * Translator for the `time` namespace, used to localize relative-time labels.
 */
export type TimeTranslator = (key: string, values?: Record<string, string | number>) => string;

/**
 * Formats an ISO timestamp as a clock time (e.g. "14:32") in the given locale.
 *
 * @param iso - The ISO timestamp.
 * @param locale - The active locale for formatting.
 * @returns The hour and minute.
 */
export function formatClockTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Whether two dates fall on the same calendar day.
 *
 * @param a - The first date.
 * @param b - The second date.
 * @returns True when they share the year, month and day.
 */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Whether a date/time separator should be shown before a message: at the first
 * message, after a gap of more than an hour, or on a new calendar day.
 *
 * @param previousIso - The previous message's timestamp, or null for the first.
 * @param currentIso - The current message's timestamp.
 * @returns True when a separator should precede the current message.
 */
export function shouldSeparateMessages(previousIso: string | null, currentIso: string): boolean {
  if (previousIso === null) {
    return true;
  }
  const previous = new Date(previousIso);
  const current = new Date(currentIso);
  if (!isSameDay(previous, current)) {
    return true;
  }
  return current.getTime() - previous.getTime() > 60 * 60 * 1000;
}

/**
 * Formats a chat date/time separator: "Today 14:32", "Yesterday 09:05" or a
 * dated label like "Mon, Jun 7 14:32" (with the year when not the current one),
 * localized to the active locale.
 *
 * @param iso - The ISO timestamp.
 * @param t - Translator for the `time` namespace.
 * @param locale - The active locale for date formatting.
 * @returns The separator label.
 */
export function formatMessageSeparator(iso: string, t: TimeTranslator, locale: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = formatClockTime(iso, locale);
  if (isSameDay(date, now)) {
    return t("today", { time });
  }
  if (isSameDay(date, yesterday)) {
    return t("yesterday", { time });
  }
  const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = "numeric";
  }
  return `${date.toLocaleDateString(locale, options)} ${time}`;
}

/**
 * Formats a user's last-active label: "active now" under a minute, "active Xm
 * ago" for 1–59 minutes, "active Xh ago" by the hour up to 12 hours, and null
 * beyond 12 hours or when there is no timestamp.
 *
 * @param iso - The last-seen ISO timestamp, or null.
 * @param t - Translator for the `time` namespace.
 * @returns The label, or null when it should not be shown.
 */
export function formatLastActive(iso: string | null, t: TimeTranslator): string | null {
  if (iso === null) {
    return null;
  }
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) {
    return t("activeNow");
  }
  if (minutes < 60) {
    return t("activeMinutes", { count: minutes });
  }
  const hours = Math.floor(minutes / 60);
  if (hours <= 12) {
    return t("activeHours", { count: hours });
  }
  return null;
}

/**
 * Formats an ISO timestamp as a short relative time (e.g. "5m", "2h", "3d"),
 * localized to the active locale.
 *
 * @param iso - The ISO timestamp.
 * @param t - Translator for the `time` namespace.
 * @param locale - The active locale for the date fallback.
 * @returns A compact relative-time label.
 */
export function formatRelativeTime(iso: string, t: TimeTranslator, locale: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  const seconds = Math.round(elapsed / 1000);
  if (seconds < 60) {
    return t("justNow");
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return t("minutes", { count: minutes });
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return t("hours", { count: hours });
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    return t("days", { count: days });
  }
  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    return t("weeks", { count: weeks });
  }
  return new Date(iso).toLocaleDateString(locale);
}
