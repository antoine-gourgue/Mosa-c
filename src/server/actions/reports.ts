"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/result";

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
  const user = await getCurrentUser();
  if (user === null) {
    throw new AppError("UNAUTHORIZED", "You must be signed in to report.");
  }
  await prisma.report.upsert({
    where: { pinId_reporterId: { pinId, reporterId: user.id } },
    update: { reason: reason ?? null, status: "PENDING" },
    create: { pinId, reporterId: user.id, reason: reason ?? null },
  });
  revalidatePath("/admin/reports");
}
