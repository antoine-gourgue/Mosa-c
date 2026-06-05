"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

/**
 * Failure outcome of {@link createPin}; a successful call redirects instead of
 * returning.
 */
export type CreatePinResult = { ok: false; error: string };

const createPinSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(120),
  description: z.string().trim().max(2000).optional(),
  link: z.union([z.literal(""), z.url()]).default(""),
  width: z.coerce.number().int().positive(),
  height: z.coerce.number().int().positive(),
});

/**
 * Creates a pin from the submitted form: stores the uploaded image, persists
 * the pin owned by the current user, saves it to their collection and
 * redirects to the board. Returns a validation error on failure.
 *
 * @param formData - The create form data (title, description, link, dimensions, image).
 * @returns A failure result, or never on success (it redirects).
 */
export async function createPin(formData: FormData): Promise<CreatePinResult> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please choose an image." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "The file must be an image." };
  }

  const parsed = createPinSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    link: formData.get("link") ?? "",
    width: formData.get("width"),
    height: formData.get("height"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await getStorage().put(buffer, { filename: file.name, contentType: file.type });

  const pin = await prisma.pin.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      link: parsed.data.link === "" ? null : parsed.data.link,
      imageUrl: stored.url,
      width: parsed.data.width,
      height: parsed.data.height,
      creatorId: user.id,
    },
  });
  await prisma.save.create({ data: { userId: user.id, pinId: pin.id } });

  revalidatePath("/");
  revalidatePath("/boards");
  redirect("/boards");
}
