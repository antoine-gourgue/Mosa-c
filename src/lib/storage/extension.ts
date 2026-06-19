import { extname } from "node:path";

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

/**
 * Returns a safe file extension for an upload, derived from its content type or
 * a sanitized version of the original filename's extension.
 *
 * @param contentType - The MIME type of the upload.
 * @param filename - The original filename.
 * @returns A sanitized extension including the leading dot.
 */
export function safeExtension(contentType: string, filename: string): string {
  const fromType = EXTENSION_BY_TYPE[contentType];
  if (fromType !== undefined) {
    return fromType;
  }
  const fromName = extname(filename).toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(fromName) ? fromName : ".bin";
}
