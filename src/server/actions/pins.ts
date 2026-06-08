"use server";

import { revalidatePath } from "next/cache";
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
    return { ok: false, error: "You must be signed in." };
  }
  const pin = await prisma.pin.findUnique({ where: { id: pinId }, select: { creatorId: true } });
  if (pin === null) {
    return { ok: false, error: "Pin not found." };
  }
  if (pin.creatorId !== user.id) {
    return { ok: false, error: "You can only delete your own pins." };
  }
  await prisma.pin.delete({ where: { id: pinId } });
  revalidatePath("/");
  revalidatePath("/boards");
  return { ok: true };
}
