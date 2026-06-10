"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { sendEmailChangeEmail, sendPasswordResetEmail } from "@/lib/email";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isUniqueConstraintError, prisma } from "@/lib/prisma";
import {
  consumeAccountToken,
  isAccountTokenOnCooldown,
  issueAccountToken,
} from "@/server/services/account-token";

/**
 * The simple result shape shared by the account actions.
 */
export type AccountActionResult = { ok: true } | { ok: false; error: string };

/**
 * The app's absolute base URL (no trailing slash) for building email links.
 *
 * @returns The base URL, or an empty string when unconfigured.
 */
function appBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

/**
 * Reads the current user's email and whether it is verified, for the settings
 * UI to reflect a pending email change in (near) real time.
 *
 * @returns The current email and verified flag, or a signed-out result.
 */
export async function getAccountStatus(): Promise<
  { ok: true; email: string; emailVerified: boolean } | { ok: false }
> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false };
  }
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, emailVerified: true },
  });
  if (record === null) {
    return { ok: false };
  }
  return { ok: true, email: record.email, emailVerified: record.emailVerified !== null };
}

/**
 * Starts an email-address change: emails a confirmation link to the new address.
 * The current email stays until the link is confirmed. Accounts that have a
 * password must re-authenticate with it before the change is accepted.
 *
 * @param newEmail - The address the user wants to switch to.
 * @param currentPassword - The account password, to confirm the user's identity.
 * @returns Whether the confirmation email was sent.
 */
export async function requestEmailChange(
  newEmail: string,
  currentPassword = "",
): Promise<AccountActionResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = z.email().safeParse(newEmail.trim().toLowerCase());
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (
    account?.passwordHash != null &&
    !(await verifyPassword(currentPassword, account.passwordHash))
  ) {
    return { ok: false, error: "Your current password is incorrect." };
  }
  const email = parsed.data;
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
    select: { id: true },
  });
  if (existing !== null) {
    return { ok: false, error: "That email is already in use." };
  }
  if (await isAccountTokenOnCooldown(user.id, "EMAIL_CHANGE")) {
    return { ok: false, error: "Please wait a minute before requesting another email." };
  }
  const token = await issueAccountToken(user.id, "EMAIL_CHANGE", email);
  const sent = await sendEmailChangeEmail(email, `${appBase()}/confirm-email?token=${token}`);
  if (!sent) {
    return { ok: false, error: "We couldn't send the confirmation email. Please try again." };
  }
  return { ok: true };
}

/**
 * Confirms a pending email change from the link, applying the new address and
 * marking it verified.
 *
 * @param token - The token from the confirmation link.
 * @returns Whether the change was applied.
 */
export async function confirmEmailChange(token: string): Promise<AccountActionResult> {
  const consumed = await consumeAccountToken(token, "EMAIL_CHANGE");
  if (consumed === null || consumed.newEmail === null) {
    return { ok: false, error: "This link is invalid or has expired." };
  }
  const taken = await prisma.user.findFirst({
    where: { email: consumed.newEmail, NOT: { id: consumed.userId } },
    select: { id: true },
  });
  if (taken !== null) {
    return { ok: false, error: "That email is already in use." };
  }
  try {
    await prisma.user.update({
      where: { id: consumed.userId },
      data: { email: consumed.newEmail, emailVerified: new Date() },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: "That email is already in use." };
    }
    throw error;
  }
  return { ok: true };
}

/**
 * Issues and emails a password-reset link to an address.
 *
 * @param userId - The user the token belongs to.
 * @param email - The address to send the link to.
 * @returns Whether the email was accepted for delivery.
 */
async function sendReset(userId: string, email: string): Promise<boolean> {
  const token = await issueAccountToken(userId, "PASSWORD_RESET");
  return sendPasswordResetEmail(email, `${appBase()}/reset-password?token=${token}`);
}

/**
 * Emails the current user a link to reset their password (from settings).
 *
 * @returns Whether the email was sent.
 */
export async function requestPasswordReset(): Promise<AccountActionResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, passwordHash: true },
  });
  if (record === null || record.passwordHash === null) {
    return { ok: false, error: "Your account has no password to reset." };
  }
  if (await isAccountTokenOnCooldown(user.id, "PASSWORD_RESET")) {
    return { ok: false, error: "Please wait a minute before requesting another email." };
  }
  const sent = await sendReset(user.id, record.email);
  if (!sent) {
    return { ok: false, error: "We couldn't send the reset email. Please try again." };
  }
  return { ok: true };
}

/**
 * The minimum time {@link requestPasswordResetForEmail} takes to respond, so the
 * presence of an account can't be inferred from how long the request runs.
 */
const RESET_MIN_DURATION_MS = 400;

/**
 * Sends a password-reset link for a typed email (the "forgot password" flow).
 * Always reports success so it never reveals whether an account exists, and pads
 * the response to a constant minimum duration so timing can't reveal it either.
 *
 * @param email - The email entered on the forgot-password page.
 * @returns Always a success result.
 */
export async function requestPasswordResetForEmail(email: string): Promise<AccountActionResult> {
  const startedAt = Date.now();
  const parsed = z.email().safeParse(email.trim().toLowerCase());
  if (parsed.success) {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data },
      select: { id: true, email: true, passwordHash: true },
    });
    if (
      user !== null &&
      user.passwordHash !== null &&
      !(await isAccountTokenOnCooldown(user.id, "PASSWORD_RESET"))
    ) {
      await sendReset(user.id, user.email);
    }
  }
  const remaining = RESET_MIN_DURATION_MS - (Date.now() - startedAt);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }
  return { ok: true };
}

/**
 * Sets a new password from a reset link, then invalidates every existing
 * session so a reset (e.g. after a compromise) logs out all other devices.
 *
 * @param token - The token from the reset link.
 * @param newPassword - The new password.
 * @returns Whether the password was reset.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<AccountActionResult> {
  const parsed = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .safeParse(newPassword);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const consumed = await consumeAccountToken(token, "PASSWORD_RESET");
  if (consumed === null) {
    return { ok: false, error: "This link is invalid or has expired." };
  }
  await prisma.user.update({
    where: { id: consumed.userId },
    data: { passwordHash: await hashPassword(parsed.data) },
  });
  await prisma.session.deleteMany({ where: { userId: consumed.userId } });
  return { ok: true };
}
