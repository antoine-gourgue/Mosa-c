/**
 * The outcome of a share attempt: handed to the native share sheet, or copied
 * to the clipboard as a fallback.
 */
export type ShareOutcome = "shared" | "copied";

/**
 * Input for {@link sharePin}.
 */
export type SharePinInput = {
  url: string;
  title: string;
};

/**
 * Shares a pin URL using the Web Share API when available, falling back to
 * copying the URL to the clipboard. A user cancelling the native sheet is
 * treated as a successful share rather than a fallback.
 *
 * @param input - The absolute pin URL and its title.
 * @returns Whether the URL was shared natively or copied to the clipboard.
 */
export async function sharePin(input: SharePinInput): Promise<ShareOutcome> {
  const { url, title } = input;
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "shared";
      }
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}

/**
 * Builds the absolute URL for a pin from the current document origin.
 *
 * @param pinId - The pin id.
 * @returns The absolute pin URL, or a relative path during server rendering.
 */
export function pinUrl(pinId: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/pin/${pinId}`;
}
