import { env } from "@/lib/env";
import { LocalStorage } from "./local";
import type { Storage } from "./types";

export type { Storage, PutOptions, PutResult } from "./types";

let instance: Storage | null = null;

/**
 * Returns the configured storage driver, selected by `STORAGE_DRIVER`. The
 * local-disk driver is the default; the S3 seam throws until an adapter is
 * added.
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
  instance = new LocalStorage();
  return instance;
}
