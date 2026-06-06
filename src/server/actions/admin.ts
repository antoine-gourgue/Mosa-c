"use server";

import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/result";

const roleSchema = z.enum(["USER", "ADMIN"]);

/**
 * Authorizes the caller as an admin, throwing when they are not signed in or
 * not an admin. The role is verified against the database.
 *
 * @returns The authenticated admin session user.
 */
async function requireAdminUser(): Promise<Session["user"]> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in.");
  }
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (record === null || record.role !== "ADMIN") {
    throw new AppError("UNAUTHORIZED", "Admins only.");
  }
  return user;
}

/**
 * Refreshes the admin surfaces affected by a user change.
 */
function revalidateAdmin(): void {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/**
 * Removes any pin, regardless of ownership. Admin moderation override of the
 * owner-only delete in the consumer app.
 *
 * @param pinId - The pin id.
 * @returns A promise that resolves once the pin is removed.
 */
export async function adminDeletePin(pinId: string): Promise<void> {
  await requireAdminUser();
  await prisma.pin.delete({ where: { id: pinId } });
  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
}

/**
 * Removes any comment, regardless of authorship.
 *
 * @param commentId - The comment id.
 * @returns A promise that resolves once the comment is removed.
 */
export async function adminDeleteComment(commentId: string): Promise<void> {
  await requireAdminUser();
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath("/admin/moderation");
  revalidatePath("/admin");
}

/**
 * Refreshes the admin surfaces affected by a report change.
 */
function revalidateReports(): void {
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

/**
 * Resolves a report by removing the reported pin. Deleting the pin cascades to
 * its reports, closing this one.
 *
 * @param reportId - The report id.
 * @returns A promise that resolves once the pin is removed.
 */
export async function resolveReport(reportId: string): Promise<void> {
  await requireAdminUser();
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { pinId: true },
  });
  if (report === null) {
    throw new AppError("NOT_FOUND", "Report not found.");
  }
  await prisma.pin.delete({ where: { id: report.pinId } });
  revalidateReports();
}

/**
 * Dismisses a report without touching the pin.
 *
 * @param reportId - The report id.
 * @returns A promise that resolves once the report is dismissed.
 */
export async function dismissReport(reportId: string): Promise<void> {
  await requireAdminUser();
  await prisma.report.update({ where: { id: reportId }, data: { status: "DISMISSED" } });
  revalidateReports();
}

/**
 * Sets a user's role. Admins cannot change their own role, to avoid locking
 * themselves out of the back office.
 *
 * @param userId - The target user id.
 * @param role - The new role.
 * @returns A promise that resolves once the role is updated.
 */
export async function setUserRole(userId: string, role: "USER" | "ADMIN"): Promise<void> {
  const admin = await requireAdminUser();
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) {
    throw new AppError("VALIDATION", "Invalid role.");
  }
  if (userId === admin.id) {
    throw new AppError("VALIDATION", "You cannot change your own role.");
  }
  await prisma.user.update({ where: { id: userId }, data: { role: parsed.data } });
  revalidateAdmin();
}

/**
 * Toggles a user's verified badge.
 *
 * @param userId - The target user id.
 * @param verified - The new verified state.
 * @returns A promise that resolves once the user is updated.
 */
export async function setUserVerified(userId: string, verified: boolean): Promise<void> {
  await requireAdminUser();
  await prisma.user.update({ where: { id: userId }, data: { verified } });
  revalidateAdmin();
}

/**
 * Bans or reinstates a user. A disabled user can no longer sign in. Admins
 * cannot ban themselves.
 *
 * @param userId - The target user id.
 * @param disabled - Whether the account should be disabled.
 * @returns A promise that resolves once the user is updated.
 */
export async function setUserDisabled(userId: string, disabled: boolean): Promise<void> {
  const admin = await requireAdminUser();
  if (userId === admin.id) {
    throw new AppError("VALIDATION", "You cannot ban your own account.");
  }
  await prisma.user.update({ where: { id: userId }, data: { disabled } });
  revalidateAdmin();
}

/**
 * Permanently deletes a user and their content (cascaded). Admins cannot delete
 * their own account here.
 *
 * @param userId - The target user id.
 * @returns A promise that resolves once the user is deleted.
 */
export async function deleteUser(userId: string): Promise<void> {
  const admin = await requireAdminUser();
  if (userId === admin.id) {
    throw new AppError("VALIDATION", "You cannot delete your own account.");
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidateAdmin();
}
