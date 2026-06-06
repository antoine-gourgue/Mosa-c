import { randomUUID } from "node:crypto";
import { StorageClient } from "@supabase/storage-js";
import { safeExtension } from "./extension";
import type { PutOptions, PutResult, Storage } from "./types";

/**
 * Storage driver uploading objects to a public Supabase Storage bucket and
 * returning their public URLs. It talks to the Storage REST API directly so it
 * has no realtime/WebSocket dependency.
 */
export class SupabaseStorage implements Storage {
  private readonly client: StorageClient;
  private readonly bucket: string;

  /**
   * Creates the driver from the validated Supabase configuration.
   *
   * @param url - The Supabase project URL.
   * @param serviceRoleKey - The Supabase service role key (server-side only).
   * @param bucket - The storage bucket name.
   */
  constructor(url: string, serviceRoleKey: string, bucket: string) {
    this.client = new StorageClient(`${url.replace(/\/$/, "")}/storage/v1`, {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    });
    this.bucket = bucket;
  }

  /**
   * Uploads the data under a unique name and returns its public URL.
   *
   * @param data - The binary file contents.
   * @param options - The original filename and content type.
   * @returns The public URL of the stored object.
   */
  async put(data: Buffer, options: PutOptions): Promise<PutResult> {
    const name = `${randomUUID()}${safeExtension(options.contentType, options.filename)}`;
    const { error } = await this.client
      .from(this.bucket)
      .upload(name, data, { contentType: options.contentType, upsert: false });
    if (error !== null) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
    const { data: published } = this.client.from(this.bucket).getPublicUrl(name);
    return { url: published.publicUrl };
  }
}
