import { env } from "@/lib/env";
import { LocalStorage } from "./local";
import { SupabaseStorage } from "./supabase";
import type { Storage } from "./types";

export type { Storage, PutOptions, PutResult } from "./types";

let instance: Storage | null = null;

/**
 * Returns the configured storage driver, selected by `STORAGE_DRIVER`. The
 * local-disk driver is the default; the Supabase driver requires its
 * configuration, and the S3 seam throws until an adapter is added.
 *
 * @returns The storage driver instance.
 */
export function getStorage(): Storage {
  if (instance !== null) {
    return instance;
  }
  if (env.STORAGE_DRIVER === "s3") {
    throw new Error(
      "S3 storage is not configured yet. Set STORAGE_DRIVER=local or add an adapter.",
    );
  }
  if (env.STORAGE_DRIVER === "supabase") {
    if (env.SUPABASE_URL === undefined || env.SUPABASE_SERVICE_ROLE_KEY === undefined) {
      throw new Error(
        "Supabase storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set.",
      );
    }
    instance = new SupabaseStorage(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      env.SUPABASE_STORAGE_BUCKET,
    );
    return instance;
  }
  instance = new LocalStorage();
  return instance;
}
