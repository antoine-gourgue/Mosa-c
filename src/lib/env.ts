import { z } from "zod";

/**
 * Schema describing every environment variable the server relies on. Optional
 * entries gate features (OAuth providers, object storage) that the app can run
 * without during local development.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  APPLE_CLIENT_ID: z.string().min(1).optional(),
  APPLE_CLIENT_SECRET: z.string().min(1).optional(),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
});

/**
 * The validated, strongly typed shape of the server environment.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates `process.env`, throwing a readable, aggregated error
 * when the configuration is missing or malformed.
 *
 * @returns The validated environment configuration.
 */
function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

/**
 * Validated, strongly typed environment configuration. Import this instead of
 * reading from `process.env` directly so misconfiguration fails fast.
 */
export const env: Env = parseEnv();
