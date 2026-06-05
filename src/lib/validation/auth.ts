import { z } from "zod";

/**
 * Validates email/password credentials submitted for sign-in.
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
 * Validates the data submitted when registering a new account.
 */
export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  age: z.coerce.number().int().min(13, "You must be at least 13.").max(120),
  gender: z.enum(["FEMALE", "MALE", "NON_BINARY", "UNDISCLOSED"]).optional(),
});

/**
 * The validated registration input.
 */
export type RegisterInput = z.infer<typeof registerSchema>;
