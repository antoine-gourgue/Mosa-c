/**
 * Categories of recoverable application errors surfaced from the server layer.
 */
export type AppErrorCode = "NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION" | "CONFLICT" | "UNKNOWN";

/**
 * A typed, recoverable error raised by services and server actions.
 */
export class AppError extends Error {
  readonly code: AppErrorCode;

  /**
   * Creates a typed application error.
   *
   * @param code - The error category.
   * @param message - A human-readable message safe to surface to the client.
   */
  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

/**
 * The outcome of an operation that can fail in a recoverable way.
 */
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

/**
 * Wraps a value in a successful {@link Result}.
 *
 * @param data - The success payload.
 * @returns A successful result.
 */
export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

/**
 * Builds a failed {@link Result} from a code and message.
 *
 * @param code - The error category.
 * @param message - A human-readable message.
 * @returns A failed result.
 */
export function fail(code: AppErrorCode, message: string): Result<never> {
  return { ok: false, error: new AppError(code, message) };
}
