"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser, signOut } from "@/lib/auth";
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
  const t = await getTranslations("errors");
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: t("signedOut") };
  }
  const parsed = z.email().safeParse(newEmail.trim().toLowerCase());
  if (!parsed.success) {
    return { ok: false, error: t("invalidEmail") };
  }
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (
    account?.passwordHash != null &&
    !(await verifyPassword(currentPassword, account.passwordHash))
  ) {
    return { ok: false, error: t("wrongPassword") };
  }
  const email = parsed.data;
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: user.id } },
    select: { id: true },
  });
  if (existing !== null) {
    return { ok: false, error: t("emailTaken") };
  }
  if (await isAccountTokenOnCooldown(user.id, "EMAIL_CHANGE")) {
    return { ok: false, error: t("emailCooldown") };
  }
  const token = await issueAccountToken(user.id, "EMAIL_CHANGE", email);
  const sent = await sendEmailChangeEmail(email, `${appBase()}/confirm-email?token=${token}`);
  if (!sent) {
    return { ok: false, error: t("emailSendFailed") };
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
  const t = await getTranslations("errors");
  const consumed = await consumeAccountToken(token, "EMAIL_CHANGE");
  if (consumed === null || consumed.newEmail === null) {
    return { ok: false, error: t("invalidLink") };
  }
  const taken = await prisma.user.findFirst({
    where: { email: consumed.newEmail, NOT: { id: consumed.userId } },
    select: { id: true },
  });
  if (taken !== null) {
    return { ok: false, error: t("emailTaken") };
  }
  try {
    await prisma.user.update({
      where: { id: consumed.userId },
      data: { email: consumed.newEmail, emailVerified: new Date() },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: t("emailTaken") };
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
  const t = await getTranslations("errors");
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: t("signedOut") };
  }
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, passwordHash: true },
  });
  if (record === null || record.passwordHash === null) {
    return { ok: false, error: t("noPassword") };
  }
  if (await isAccountTokenOnCooldown(user.id, "PASSWORD_RESET")) {
    return { ok: false, error: t("emailCooldown") };
  }
  const sent = await sendReset(user.id, record.email);
  if (!sent) {
    return { ok: false, error: t("resetSendFailed") };
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
  const t = await getTranslations("errors");
  const parsed = z.string().min(8, t("passwordTooShort")).safeParse(newPassword);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t("checkForm") };
  }
  const consumed = await consumeAccountToken(token, "PASSWORD_RESET");
  if (consumed === null) {
    return { ok: false, error: t("invalidLink") };
  }
  await prisma.user.update({
    where: { id: consumed.userId },
    data: { passwordHash: await hashPassword(parsed.data) },
  });
  await prisma.session.deleteMany({ where: { userId: consumed.userId } });
  return { ok: true };
}

/**
 * Permanently deletes the current user's account and all their data. Acts as a
 * GDPR erasure: the database cascade removes the user's pins, boards, comments,
 * likes, saves, follows, blocks, reports, conversations and notifications. The
 * caller must confirm by typing their exact username (or "DELETE" for accounts
 * without a handle). Signs out and redirects to the login page on success.
 *
 * @param confirmation - The confirmation string the user typed.
 * @returns A failure result on mismatch; redirects on success.
 */
export async function deleteAccount(confirmation: string): Promise<AccountActionResult> {
  const t = await getTranslations("errors");
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: t("signedOut") };
  }
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true },
  });
  if (record === null) {
    return { ok: false, error: t("signedOut") };
  }
  const expected = record.username ?? "DELETE";
  if (confirmation.trim() !== expected) {
    return { ok: false, error: t("deleteConfirmMismatch") };
  }
  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirectTo: "/login" });
  return { ok: true };
}
