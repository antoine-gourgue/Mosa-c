"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { errorMessage } from "@/server/error-message";
import { createStory as createStoryRecord } from "@/server/services";

/** Failure outcome of {@link createStory}; success redirects instead. */
export type CreateStoryResult = { ok: false; error: string };

/** Server-side guards mirroring the create form's video limits. */
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 60;

const storySchema = z.object({
  width: z.coerce.number().int().positive(),
  height: z.coerce.number().int().positive(),
});

/**
 * Posts a story from the submitted form: stores the poster image (and the video
 * for a video story), persists a story owned by the current user that expires
 * 24h later, and redirects home. Returns a validation error on failure.
 *
 * @param formData - The story form data (image poster, optional video, dimensions).
 * @returns A failure result, or never on success (it redirects).
 */
export async function createStory(formData: FormData): Promise<CreateStoryResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: await errorMessage("chooseImage") };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: await errorMessage("fileNotImage") };
  }

  const parsed = storySchema.safeParse({
    width: formData.get("width"),
    height: formData.get("height"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const isVideo = formData.get("mediaType")?.toString() === "VIDEO";
  let videoUrl: string | null = null;
  let videoDurationS: number | null = null;
  if (isVideo) {
    const video = formData.get("video");
    if (
      !(video instanceof File) ||
      video.size === 0 ||
      !ACCEPTED_VIDEO_TYPES.includes(video.type)
    ) {
      return { ok: false, error: await errorMessage("fileNotVideo") };
    }
    if (video.size > MAX_VIDEO_BYTES) {
      return { ok: false, error: await errorMessage("videoTooLarge") };
    }
    const durationRaw = Number(formData.get("videoDurationS")?.toString() ?? "");
    if (Number.isFinite(durationRaw) && durationRaw > MAX_VIDEO_SECONDS) {
      return { ok: false, error: await errorMessage("videoTooLong") };
    }
    const stored = await getStorage().put(Buffer.from(await video.arrayBuffer()), {
      filename: video.name,
      contentType: video.type,
    });
    videoUrl = stored.url;
    videoDurationS =
      Number.isFinite(durationRaw) && durationRaw > 0 ? Math.round(durationRaw) : null;
  }

  const poster = await getStorage().put(Buffer.from(await file.arrayBuffer()), {
    filename: file.name,
    contentType: file.type,
  });

  await createStoryRecord({
    authorId: user.id,
    mediaType: isVideo ? "VIDEO" : "IMAGE",
    imageUrl: poster.url,
    videoUrl,
    width: parsed.data.width,
    height: parsed.data.height,
    videoDurationS,
  });

  revalidatePath("/");
  redirect("/");
}
