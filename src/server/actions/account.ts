"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { sendEmailChangeEmail, sendPasswordResetEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { consumeAccountToken, issueAccountToken } from "@/server/services/account-token";

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
 * Starts an email-address change: emails a confirmation link to the new address.
 * The current email stays until the link is confirmed.
 *
 * @param newEmail - The address the user wants to switch to.
 * @returns Whether the confirmation email was sent.
 */
export async function requestEmailChange(newEmail: string): Promise<AccountActionResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const parsed = z.email().safeParse(newEmail.trim().toLowerCase());
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const email = parsed.data;
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
    select: { id: true },
  });
  if (existing !== null) {
    return { ok: false, error: "That email is already in use." };
  }
  const token = await issueAccountToken(user.id, "EMAIL_CHANGE", email);
  await sendEmailChangeEmail(email, `${appBase()}/confirm-email?token=${token}`);
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
  await prisma.user.update({
    where: { id: consumed.userId },
    data: { email: consumed.newEmail, emailVerified: new Date() },
  });
  return { ok: true };
}

/**
 * Issues and emails a password-reset link to an address.
 *
 * @param userId - The user the token belongs to.
 * @param email - The address to send the link to.
 */
async function sendReset(userId: string, email: string): Promise<void> {
  const token = await issueAccountToken(userId, "PASSWORD_RESET");
  await sendPasswordResetEmail(email, `${appBase()}/reset-password?token=${token}`);
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
  await sendReset(user.id, record.email);
  return { ok: true };
}

/**
 * Sends a password-reset link for a typed email (the "forgot password" flow).
 * Always reports success so it never reveals whether an account exists.
 *
 * @param email - The email entered on the forgot-password page.
 * @returns Always a success result.
 */
export async function requestPasswordResetForEmail(email: string): Promise<AccountActionResult> {
  const parsed = z.email().safeParse(email.trim().toLowerCase());
  if (parsed.success) {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data },
      select: { id: true, email: true, passwordHash: true },
    });
    if (user !== null && user.passwordHash !== null) {
      await sendReset(user.id, user.email);
    }
  }
  return { ok: true };
}

/**
 * Sets a new password from a reset link.
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
  return { ok: true };
}
