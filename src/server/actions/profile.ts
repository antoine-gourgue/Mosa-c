"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isUniqueConstraintError, prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { usernameSchema } from "@/lib/validation/auth";

/**
 * Failure outcome of {@link updateProfile}; a successful call redirects.
 */
export type UpdateProfileResult = { ok: false; error: string };

/**
 * Maximum accepted avatar size, matching the client-side compression limit, so
 * oversized uploads are rejected before being buffered into memory.
 */
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

const profileSchema = z.object({
  username: usernameSchema,
  name: z.string().trim().min(1, "A name is required.").max(60),
  bio: z.string().trim().max(300).optional(),
  gender: z.enum(["FEMALE", "MALE", "NON_BINARY", "UNDISCLOSED"]).optional(),
});

/**
 * Updates the current user's profile — username, display name, bio, gender and
 * avatar (uploaded or removed) — then redirects to their profile. Returns a
 * validation/conflict error on failure.
 *
 * @param formData - The edit form data.
 * @returns A failure result, or never on success (it redirects).
 */
export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    name: formData.get("name"),
    bio: formData.get("bio") ?? undefined,
    gender: formData.get("gender") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const handle = parsed.data.username.toLowerCase();

  const taken = await prisma.user.findFirst({
    where: { username: handle, NOT: { id: user.id } },
    select: { id: true },
  });
  if (taken !== null) {
    return { ok: false, error: "That username is already taken." };
  }

  let avatar: { avatarUrl: string | null; image: string | null } | undefined;
  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "The avatar must be an image." };
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return { ok: false, error: "The avatar is too large." };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await getStorage().put(buffer, { filename: file.name, contentType: file.type });
    avatar = { avatarUrl: stored.url, image: stored.url };
  } else if (formData.get("removeAvatar") === "true") {
    avatar = { avatarUrl: null, image: null };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        username: handle,
        name: parsed.data.name,
        bio: parsed.data.bio ?? null,
        gender: parsed.data.gender ?? null,
        ...(avatar ?? {}),
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: "That username is already taken." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/boards");
  redirect(`/u/${handle}`);
}
