"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Records that a pin's image was downloaded by incrementing its download count.
 * Downloads are anonymous, so no authentication is required.
 *
 * @param pinId - The id of the downloaded pin.
 * @returns The updated download count.
 */
export async function recordDownload(pinId: string): Promise<{ count: number }> {
  const pin = await prisma.pin.update({
    where: { id: pinId },
    data: { downloadCount: { increment: 1 } },
    select: { downloadCount: true },
  });
  revalidatePath(`/pin/${pinId}`);
  return { count: pin.downloadCount };
}
