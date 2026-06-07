/**
 * Formats an ISO timestamp as a clock time (e.g. "14:32").
 *
 * @param iso - The ISO timestamp.
 * @returns The hour and minute.
 */
export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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
 * dated label like "Mon, Jun 7 14:32" (with the year when not the current one).
 *
 * @param iso - The ISO timestamp.
 * @returns The separator label.
 */
export function formatMessageSeparator(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = formatClockTime(iso);
  if (isSameDay(date, now)) {
    return `Today ${time}`;
  }
  if (isSameDay(date, yesterday)) {
    return `Yesterday ${time}`;
  }
  const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = "numeric";
  }
  return `${date.toLocaleDateString(undefined, options)} ${time}`;
}

/**
 * Formats an ISO timestamp as a short relative time (e.g. "5m", "2h", "3d").
 *
 * @param iso - The ISO timestamp.
 * @returns A compact relative-time label.
 */
export function formatRelativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  const seconds = Math.round(elapsed / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }
  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    return `${weeks}w`;
  }
  return new Date(iso).toLocaleDateString();
}
