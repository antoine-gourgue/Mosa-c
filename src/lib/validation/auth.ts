import { z } from "zod";

/**
 * Translator for the `errors` namespace, used to build localized schemas.
 */
type ErrorTranslator = (key: string) => string;

/**
 * Validates email/password credentials submitted for sign-in. No custom
 * messages, so it needs no translations.
 */
export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

/**
 * The validated sign-in credentials.
 */
export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Builds the username validator (3–20 chars, letters, numbers, underscores)
 * with localized messages. Shared between sign-up and profile editing.
 *
 * @param t - Translator for the `errors` namespace.
 * @returns The username zod schema.
 */
export const usernameSchema = (t: ErrorTranslator) =>
  z
    .string()
    .trim()
    .min(3, t("usernameMin"))
    .max(20, t("usernameMax"))
    .regex(/^[a-zA-Z0-9_]+$/, t("usernameChars"));

/**
 * Builds the registration validator with localized messages.
 *
 * @param t - Translator for the `errors` namespace.
 * @returns The registration zod schema.
 */
export const registerSchema = (t: ErrorTranslator) =>
  z.object({
    username: usernameSchema(t),
    email: z.email(),
    password: z.string().min(8, t("passwordTooShort")),
    age: z.coerce.number().int().min(13, t("ageMin")).max(120),
    gender: z.enum(["FEMALE", "MALE", "NON_BINARY", "UNDISCLOSED"]).optional(),
  });

/**
 * The validated registration input.
 */
export type RegisterInput = z.infer<ReturnType<typeof registerSchema>>;
