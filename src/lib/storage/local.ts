import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { PutOptions, PutResult, Storage } from "./types";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

/**
 * Returns a safe file extension, falling back to a sanitized version of the
 * original filename's extension.
 *
 * @param contentType - The MIME type of the upload.
 * @param filename - The original filename.
 * @returns A sanitized extension including the leading dot.
 */
function safeExtension(contentType: string, filename: string): string {
  const fromType = EXTENSION_BY_TYPE[contentType];
  if (fromType !== undefined) {
    return fromType;
  }
  const fromName = extname(filename).toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(fromName) ? fromName : ".bin";
}

/**
 * Storage driver writing uploads to `public/uploads` and serving them from the
 * `/uploads` path.
 */
export class LocalStorage implements Storage {
  /**
   * Writes the data to the uploads directory under a unique, sanitized name.
   *
   * @param data - The binary file contents.
   * @param options - The original filename and content type.
   * @returns The public URL of the stored file.
   */
  async put(data: Buffer, options: PutOptions): Promise<PutResult> {
    const name = `${randomUUID()}${safeExtension(options.contentType, options.filename)}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, name), data);
    return { url: `/uploads/${name}` };
  }
}
