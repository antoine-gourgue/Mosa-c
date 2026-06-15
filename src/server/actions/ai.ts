"use server";

import { aiAvailable, describeImage, generateImage, suggestTags } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { errorMessage } from "@/server/error-message";
import { imageGenerationsRemaining, recordImageGeneration } from "@/server/services";

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

/**
 * The result of generating a pin image from a prompt.
 */
export type GeneratePinImageResult =
  | { ok: true; dataUrl: string; width: number; height: number; remaining: number }
  | { ok: false; error: string };

/**
 * Generates a pin image from a text prompt (FLUX via Pollinations), enforcing
 * the per-user daily limit: it checks the remaining allowance first, only
 * records a generation once one succeeds (so a failed attempt never burns the
 * quota), and returns the image as a data URL the create form turns into a file.
 *
 * @param prompt - The text prompt to render.
 * @returns The generated image and remaining allowance, or an error.
 */
export async function generatePinImage(prompt: string): Promise<GeneratePinImageResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  if (prompt.trim() === "") {
    return { ok: false, error: await errorMessage("promptRequired") };
  }
  const remaining = await imageGenerationsRemaining(user.id);
  if (remaining <= 0) {
    return { ok: false, error: await errorMessage("aiLimitReached") };
  }
  const image = await generateImage(prompt);
  if (image === null) {
    return { ok: false, error: await errorMessage("aiGenerateFailed") };
  }
  await recordImageGeneration(user.id);
  return {
    ok: true,
    dataUrl: image.dataUrl,
    width: image.width,
    height: image.height,
    remaining: remaining - 1,
  };
}
