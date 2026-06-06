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
