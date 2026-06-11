"use server";

import { aiAvailable, describeImage, suggestTags } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

/**
 * The AI analysis of a pin image: a short alt text and suggested tags. Both are
 * empty when AI is unconfigured or the call fails.
 */
export type PinImageAnalysis = {
  altText: string | null;
  tags: string[];
};

/**
 * Analyzes a to-be-published pin image with the vision model to produce an alt
 * text and suggested tags, so the create form can pre-fill them. Runs off the
 * locally-selected image (sent as a data URI), independent of the publish path,
 * and degrades to empty results when AI is unavailable — it never blocks
 * publishing.
 *
 * @param formData - The image file plus optional title and description context.
 * @returns The alt text and suggested tags.
 */
export async function analyzePinImage(formData: FormData): Promise<PinImageAnalysis> {
  const user = await getCurrentUser();
  if (user === null || !aiAvailable()) {
    return { altText: null, tags: [] };
  }
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith("image/")) {
    return { altText: null, tags: [] };
  }
  const title = formData.get("title")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  const [altText, tags] = await Promise.all([
    describeImage(dataUri),
    suggestTags({ title, description, imageUrl: dataUri }),
  ]);
  return { altText, tags };
}
