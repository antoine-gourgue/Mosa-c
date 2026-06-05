"use server";

import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import {
  registerSchema,
  signInSchema,
  type RegisterInput,
  type SignInInput,
} from "@/lib/validation/auth";

/**
 * Outcome of a form-bound server action, carrying field-level or form-level
 * errors when it fails.
 */
export type ActionResult =
  | { ok: true }
  | { ok: false; formError?: string; fieldErrors?: Record<string, string> };

/**
 * Collects the first Zod issue per field into a flat error map.
 *
 * @param issues - The Zod issues to flatten.
 * @returns A map of field name to error message.
 */
function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && errors[key] === undefined) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

/**
 * Registers a new account, creates its default Quick Saves board and signs the
 * user in. Returns field errors for invalid input or a duplicate email.
 *
 * @param input - The registration data.
 * @returns The action result (a successful call redirects to the home feed).
 */
export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error.issues) };
  }
  const { email, password, gender } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing !== null) {
    return { ok: false, fieldErrors: { email: "An account with this email already exists." } };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: email.split("@")[0] ?? "Member",
      gender,
      boards: { create: { name: "Quick Saves", isDefault: true } },
    },
  });

  await signIn("credentials", { email, password, redirectTo: "/" });
  return { ok: true };
}

/**
 * Signs an existing user in with email and password.
 *
 * @param input - The sign-in credentials.
 * @returns The action result (a successful call redirects to the home feed).
 */
export async function loginUser(input: SignInInput): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error.issues) };
  }
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/" });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, formError: "Invalid email or password." };
    }
    throw error;
  }
}
