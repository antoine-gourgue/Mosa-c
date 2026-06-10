"use server";

import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { hashPassword, verifyPassword } from "@/lib/password";
import { issueOtp, OTP_TTL_MS } from "@/server/services/otp";
import {
  registerSchema,
  signInSchema,
  type RegisterInput,
  type SignInInput,
} from "@/lib/validation/auth";

/**
 * Minimum delay between two code emails for the same address.
 */
const OTP_RESEND_INTERVAL_MS = 30 * 1000;

/**
 * Outcome of a form-bound server action, carrying field-level or form-level
 * errors when it fails. `needsVerification` redirects the caller to the email
 * verification step.
 */
export type ActionResult =
  | { ok: true }
  | {
      ok: false;
      formError?: string;
      fieldErrors?: Record<string, string>;
      needsVerification?: boolean;
      email?: string;
    };

/**
 * Generates a verification code for an email and sends it, swallowing send
 * failures so the flow continues (the code is also logged in development).
 *
 * @param email - The address to verify.
 */
async function issueAndSendOtp(email: string): Promise<void> {
  const code = await issueOtp(email);
  await sendOtpEmail(email, code);
}

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
 * Registers a new account (unverified) and emails a one-time verification code.
 * The user is not signed in until they confirm the code on the verify page.
 * Returns field errors for invalid input or a duplicate email.
 *
 * @param input - The registration data.
 * @returns The action result; on success the caller goes to the verify step.
 */
export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  const t = await getTranslations("errors");
  const parsed = registerSchema(t as (key: string) => string).safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: toFieldErrors(parsed.error.issues) };
  }
  const { username, email, password, gender } = parsed.data;
  const handle = username.toLowerCase();

  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.user.findUnique({ where: { username: handle }, select: { id: true } }),
  ]);
  if (existingEmail !== null) {
    return { ok: false, fieldErrors: { email: t("emailExists") } };
  }
  if (existingUsername !== null) {
    return { ok: false, fieldErrors: { username: t("usernameTaken") } };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      email,
      username: handle,
      passwordHash,
      name: username,
      gender,
      boards: { create: { name: "Quick Saves", isDefault: true } },
    },
  });

  await issueAndSendOtp(email);
  return { ok: false, needsVerification: true, email };
}

/**
 * Confirms an email verification code, which both verifies the account and
 * signs the user in (the code is a one-time credential).
 *
 * @param email - The email being verified.
 * @param code - The 6-digit code submitted by the user.
 * @returns The action result (a successful call redirects to the home feed).
 */
export async function verifyOtp(email: string, code: string): Promise<ActionResult> {
  try {
    await signIn("email-otp", { email, code: code.trim(), redirectTo: "/" });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, formError: (await getTranslations("errors"))("invalidCode") };
    }
    throw error;
  }
}

/**
 * Re-issues and re-sends a verification code, throttled per address. Always
 * reports success so it never reveals whether an address has an account.
 *
 * @param email - The email to send a fresh code to.
 * @returns A success result.
 */
export async function resendOtp(email: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });
  if (user === null || user.emailVerified !== null) {
    return { ok: true };
  }
  const existing = await prisma.emailOtp.findUnique({
    where: { email },
    select: { expiresAt: true },
  });
  const lastIssuedAt = existing === null ? 0 : existing.expiresAt.getTime() - OTP_TTL_MS;
  if (Date.now() - lastIssuedAt < OTP_RESEND_INTERVAL_MS) {
    return { ok: true };
  }
  await issueAndSendOtp(email);
  return { ok: true };
}

/**
 * Starts an OAuth sign-in flow with the given provider.
 *
 * @param provider - The OAuth provider id.
 * @returns A promise that never resolves on success (it redirects).
 */
export async function signInWithProvider(provider: "google"): Promise<void> {
  await signIn(provider, { redirectTo: "/" });
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

  const account = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { passwordHash: true, disabled: true, emailVerified: true },
  });
  if (
    account !== null &&
    account.passwordHash !== null &&
    !account.disabled &&
    account.emailVerified === null &&
    (await verifyPassword(parsed.data.password, account.passwordHash))
  ) {
    await issueAndSendOtp(parsed.data.email);
    return { ok: false, needsVerification: true, email: parsed.data.email };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/" });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, formError: (await getTranslations("errors"))("invalidCredentials") };
    }
    throw error;
  }
}

/**
 * Signs the current user out and redirects to the login page.
 *
 * @returns A promise that never resolves normally, as it redirects.
 */
export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
