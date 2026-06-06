import { z } from "zod";

/**
 * Treats empty environment strings as absent so optional variables left blank
 * in `.env` (e.g. unused OAuth credentials) do not fail validation.
 *
 * @param value - The raw environment value.
 * @returns The value, or undefined when it is an empty string.
 */
function blankToUndefined(value: unknown): unknown {
  return value === "" ? undefined : value;
}

const optionalSecret = z.preprocess(blankToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(blankToUndefined, z.url().optional());

/**
 * Schema describing every environment variable the server relies on. Optional
 * entries gate features (OAuth providers, object storage) that the app can run
 * without during local development.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: optionalUrl,
  GOOGLE_CLIENT_ID: optionalSecret,
  GOOGLE_CLIENT_SECRET: optionalSecret,
  APPLE_CLIENT_ID: optionalSecret,
  APPLE_CLIENT_SECRET: optionalSecret,
  STORAGE_DRIVER: z.enum(["local", "s3", "supabase"]).default("local"),
  SUPABASE_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  SUPABASE_STORAGE_BUCKET: z.preprocess(blankToUndefined, z.string().default("pins")),
  UMAMI_SRC: optionalUrl,
  UMAMI_WEBSITE_ID: optionalSecret,
  NEXT_PUBLIC_APP_URL: optionalUrl,
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
