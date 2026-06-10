"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { errorMessage } from "@/server/error-message";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { slugify } from "@/lib/slug";

/**
 * Failure outcome of {@link createPin}; a successful call redirects instead of
 * returning.
 */
export type CreatePinResult = { ok: false; error: string };

/**
 * Maximum number of tags accepted on a pin.
 */
const MAX_TAGS = 8;

/**
 * Parses the raw comma-separated tags field into unique `{ slug, name }` pairs,
 * trimming, capping the length and count, and dropping blanks and duplicates.
 *
 * @param raw - The raw tags value from the form.
 * @returns The validated tag pairs.
 */
function parseTagNames(raw: string): { slug: string; name: string }[] {
  const seen = new Set<string>();
  const result: { slug: string; name: string }[] = [];
  for (const part of raw.split(",")) {
    const name = part.trim().slice(0, 30);
    const slug = slugify(name);
    if (name === "" || slug === "" || seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    result.push({ slug, name });
    if (result.length >= MAX_TAGS) {
      break;
    }
  }
  return result;
}

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
    return { ok: false, error: await errorMessage("signedOut") };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: await errorMessage("chooseImage") };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: await errorMessage("fileNotImage") };
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

  const tags = parseTagNames(formData.get("tags")?.toString() ?? "");
  for (const { slug, name } of tags) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { slug, name },
    });
    await prisma.pinTag.create({ data: { pinId: pin.id, tagId: tag.id } });
  }

  const boardName = (formData.get("board")?.toString() ?? "").trim() || "Quick Saves";
  const board =
    (await prisma.board.findFirst({
      where: { ownerId: user.id, name: { equals: boardName, mode: "insensitive" } },
    })) ??
    (await prisma.board.create({
      data: {
        ownerId: user.id,
        name: boardName,
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    }));

  if (board.isDefault) {
    await prisma.save.upsert({
      where: { userId_pinId: { userId: user.id, pinId: pin.id } },
      update: {},
      create: { userId: user.id, pinId: pin.id },
    });
  } else {
    await prisma.boardPin.upsert({
      where: { boardId_pinId: { boardId: board.id, pinId: pin.id } },
      update: {},
      create: { boardId: board.id, pinId: pin.id },
    });
  }

  revalidatePath("/");
  revalidatePath("/boards");
  redirect(`/boards/${board.id}`);
}

/**
 * Deletes a pin owned by the current user. Related likes, comments, saves,
 * board entries and notifications are removed by the database cascade.
 *
 * @param pinId - The id of the pin to delete.
 * @returns A success result, or a failure with an error message.
 */
export async function deletePin(
  pinId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  const pin = await prisma.pin.findUnique({ where: { id: pinId }, select: { creatorId: true } });
  if (pin === null) {
    return { ok: false, error: await errorMessage("pinNotFound") };
  }
  if (pin.creatorId !== user.id) {
    return { ok: false, error: await errorMessage("deleteOwnPins") };
  }
  await prisma.pin.delete({ where: { id: pinId } });
  revalidatePath("/");
  revalidatePath("/boards");
  return { ok: true };
}

/**
 * Result of {@link updatePin}.
 */
export type UpdatePinResult = { ok: true } | { ok: false; error: string };

/**
 * Updates a pin's title, description, link and tags. Allowed for the creator
 * only; the image is not editable. Tags are replaced with the submitted set.
 *
 * @param pinId - The pin to update.
 * @param formData - The edit form data (title, description, link, tags).
 * @returns Whether the update succeeded.
 */
export async function updatePin(pinId: string, formData: FormData): Promise<UpdatePinResult> {
  const t = await getTranslations("errors");
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: t("signedOut") };
  }
  const pin = await prisma.pin.findUnique({ where: { id: pinId }, select: { creatorId: true } });
  if (pin === null) {
    return { ok: false, error: t("pinNotFound") };
  }
  if (pin.creatorId !== user.id) {
    return { ok: false, error: t("editOwnPins") };
  }
  const parsed = z
    .object({
      title: z.string().trim().min(1, t("titleRequired")).max(120),
      description: z.string().trim().max(2000).optional(),
      link: z.union([z.literal(""), z.url()]).default(""),
    })
    .safeParse({
      title: formData.get("title"),
      description: formData.get("description") ?? undefined,
      link: formData.get("link") ?? "",
    });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? t("checkForm") };
  }
  await prisma.pin.update({
    where: { id: pinId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      link: parsed.data.link === "" ? null : parsed.data.link,
    },
  });
  const tags = parseTagNames(formData.get("tags")?.toString() ?? "");
  await prisma.pinTag.deleteMany({ where: { pinId } });
  for (const { slug, name } of tags) {
    const tag = await prisma.tag.upsert({ where: { slug }, update: {}, create: { slug, name } });
    await prisma.pinTag.create({ data: { pinId, tagId: tag.id } });
  }
  revalidatePath("/");
  revalidatePath(`/pin/${pinId}`);
  revalidatePath("/boards");
  return { ok: true };
}
