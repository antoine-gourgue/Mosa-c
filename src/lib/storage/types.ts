/**
 * Options describing the object being stored.
 */
export type PutOptions = {
  filename: string;
  contentType: string;
};

/**
 * The result of storing an object.
 */
export type PutResult = {
  url: string;
};

/**
 * Storage backend abstraction. Implementations persist binary data and return a
 * stable, publicly servable URL, so the local-disk driver can be swapped for an
 * object store (e.g. S3) without changing callers.
 */
export type Storage = {
  put(data: Buffer, options: PutOptions): Promise<PutResult>;
};
