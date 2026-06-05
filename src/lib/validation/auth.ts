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
