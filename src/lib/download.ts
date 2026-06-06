/**
 * Input for {@link downloadPin}.
 */
export type DownloadPinInput = {
  url: string;
  title: string;
};

/**
 * Extracts a file extension from an image URL, defaulting to `jpg` when none is
 * present. Query strings and hashes are ignored.
 *
 * @param url - The image URL.
 * @returns The lower-case extension without a leading dot.
 */
function extensionFromUrl(url: string): string {
  const path = url.split(/[?#]/)[0] ?? url;
  const match = path.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? "jpg";
}

/**
 * Builds a filesystem-friendly download filename from a pin title and the
 * source URL's extension.
 *
 * @param title - The pin title.
 * @param url - The image URL, used for the extension.
 * @returns A sanitized filename such as `sunset-over-the-bay.jpg`.
 */
export function pinFilename(title: string, url: string): string {
  const slug =
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "pin";
  return `${slug}.${extensionFromUrl(url)}`;
}

/**
 * Downloads a pin image to the user's device. The image is fetched as a blob so
 * the browser saves it rather than navigating, which works for both uploaded
 * (`/uploads`) and seeded (`/images`) sources.
 *
 * @param input - The image URL and pin title used for the filename.
 * @returns A promise that resolves once the download has been triggered.
 */
export async function downloadPin(input: DownloadPinInput): Promise<void> {
  const { url, title } = input;
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = pinFilename(title, url);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
