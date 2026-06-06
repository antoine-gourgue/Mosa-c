"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

/**
 * Failure outcome of {@link updateProfile}; a successful call redirects.
 */
export type UpdateProfileResult = { ok: false; error: string };

const profileSchema = z.object({
  name: z.string().trim().min(1, "A name is required.").max(60),
  bio: z.string().trim().max(300).optional(),
});

/**
 * Updates the current user's display name, bio and (optionally) avatar, then
 * redirects to their profile. Returns a validation error on failure.
 *
 * @param formData - The edit form data (name, bio, optional avatar).
 * @returns A failure result, or never on success (it redirects).
 */
export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  let avatarUrl: string | undefined;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    if (!avatar.type.startsWith("image/")) {
      return { ok: false, error: "The avatar must be an image." };
    }
    const buffer = Buffer.from(await avatar.arrayBuffer());
    const stored = await getStorage().put(buffer, {
      filename: avatar.name,
      contentType: avatar.type,
    });
    avatarUrl = stored.url;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio ?? null,
      ...(avatarUrl !== undefined ? { avatarUrl, image: avatarUrl } : {}),
    },
    select: { username: true },
  });

  revalidatePath("/");
  revalidatePath("/boards");
  redirect(updated.username !== null ? `/u/${updated.username}` : "/");
}
