import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { safeExtension } from "./extension";
import type { PutOptions, PutResult, Storage } from "./types";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

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
