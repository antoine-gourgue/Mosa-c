"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/result";

/**
 * Resolves the signed-in reporter's id, throwing when no user is signed in.
 *
 * @returns The current user's id.
 */
async function requireReporterId(): Promise<string> {
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to report.");
  }
  return user.id;
}

/**
 * Reports a pin for review. Persists a pending report from the signed-in user.
 * A user reporting the same pin again refreshes their existing report rather
 * than creating a duplicate, and reopens it if it had been resolved.
 *
 * @param pinId - The reported pin id.
 * @param reason - An optional free-text reason.
 * @returns A promise that resolves once the report is recorded.
 */
export async function reportPin(pinId: string, reason?: string): Promise<void> {
  const reporterId = await requireReporterId();
  await prisma.report.upsert({
    where: { pinId_reporterId: { pinId, reporterId } },
    update: { reason: reason ?? null, status: "PENDING" },
    create: { targetType: "PIN", pinId, reporterId, reason: reason ?? null },
  });
  revalidatePath("/admin/reports");
}

/**
 * Reports a comment for review. Behaves like {@link reportPin}, keyed by comment
 * and reporter so a user has at most one open report per comment.
 *
 * @param commentId - The reported comment id.
 * @param reason - An optional free-text reason.
 * @returns A promise that resolves once the report is recorded.
 */
export async function reportComment(commentId: string, reason?: string): Promise<void> {
  const reporterId = await requireReporterId();
  await prisma.report.upsert({
    where: { commentId_reporterId: { commentId, reporterId } },
    update: { reason: reason ?? null, status: "PENDING" },
    create: { targetType: "COMMENT", commentId, reporterId, reason: reason ?? null },
  });
  revalidatePath("/admin/reports");
}

/**
 * Reports a user/profile for review. Behaves like {@link reportPin}, keyed by
 * target user and reporter. Refuses self-reports.
 *
 * @param userId - The reported user id.
 * @param reason - An optional free-text reason.
 * @returns A promise that resolves once the report is recorded.
 */
export async function reportUser(userId: string, reason?: string): Promise<void> {
  const reporterId = await requireReporterId();
  if (reporterId === userId) {
    throw new AppError("VALIDATION", "You cannot report yourself.");
  }
  await prisma.report.upsert({
    where: { targetUserId_reporterId: { targetUserId: userId, reporterId } },
    update: { reason: reason ?? null, status: "PENDING" },
    create: { targetType: "USER", targetUserId: userId, reporterId, reason: reason ?? null },
  });
  revalidatePath("/admin/reports");
}
