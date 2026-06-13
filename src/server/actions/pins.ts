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
import { embedPin } from "@/server/services/embeddings";

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

/**
 * The persisted place columns for a pin, or all-null when no place was attached.
 */
type PinPlaceColumns = {
  placeName: string | null;
  placeAddress: string | null;
  lat: number | null;
  lng: number | null;
  placeApproximate: boolean;
};

/**
 * The raw place a user submitted, with exact coordinates and their privacy
 * intent, before any approximation is applied.
 */
type ParsedPlace = {
  placeName: string | null;
  placeAddress: string | null;
  lat: number | null;
  lng: number | null;
  approximate: boolean;
};

/**
 * The existing pin's place, used to avoid re-fuzzing an unchanged approximate
 * location on every save.
 */
type ExistingPlace = { lat: number | null; lng: number | null; placeApproximate: boolean };

/**
 * Roughly one kilometre expressed in degrees of latitude.
 */
const FUZZ_DEGREES = 0.009;

/**
 * Offsets a coordinate by a random vector of up to ~1 km, scaling the longitude
 * by latitude so the blur stays roughly circular. Used to hide a pin's exact
 * spot when the creator marks its location approximate.
 *
 * @param lat - The exact latitude.
 * @param lng - The exact longitude.
 * @returns The fuzzed coordinates, rounded to 5 decimals.
 */
function fuzzCoords(lat: number, lng: number): { lat: number; lng: number } {
  const dLat = (Math.random() * 2 - 1) * FUZZ_DEGREES;
  const scale = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  const dLng = ((Math.random() * 2 - 1) * FUZZ_DEGREES) / scale;
  return {
    lat: Math.round((lat + dLat) * 1e5) / 1e5,
    lng: Math.round((lng + dLng) * 1e5) / 1e5,
  };
}

/**
 * Reads the optional place fields from the form. A place is only kept when it
 * has a name and finite, in-range coordinates, so an empty field never persists
 * a null-island (0, 0) point; the address is optional. Coordinates are read
 * directly (not via {@link z.coerce}, which would turn an empty string into 0).
 *
 * @param formData - The submitted form data.
 * @returns The raw place, all null when no valid place was provided.
 */
function parsePlace(formData: FormData): ParsedPlace {
  const empty: ParsedPlace = {
    placeName: null,
    placeAddress: null,
    lat: null,
    lng: null,
    approximate: false,
  };
  const name = (formData.get("placeName")?.toString() ?? "").trim();
  const lat = Number(formData.get("lat")?.toString() ?? "");
  const lng = Number(formData.get("lng")?.toString() ?? "");
  if (name === "" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return empty;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return empty;
  }
  const address = (formData.get("placeAddress")?.toString() ?? "").trim();
  return {
    placeName: name.slice(0, 200),
    placeAddress: address === "" ? null : address.slice(0, 500),
    lat,
    lng,
    approximate: formData.get("placeApproximate")?.toString() === "true",
  };
}

/**
 * Resolves the place columns to persist. For an approximate location the street
 * address is dropped and the coordinates are fuzzed to ~1 km, unless they are
 * unchanged from an already-approximate pin (so editing other fields does not
 * drift the point on every save).
 *
 * @param parsed - The raw submitted place.
 * @param existing - The pin's current place, when editing.
 * @returns The columns to write.
 */
function finalizePlace(parsed: ParsedPlace, existing?: ExistingPlace): PinPlaceColumns {
  if (parsed.placeName === null || parsed.lat === null || parsed.lng === null) {
    return { placeName: null, placeAddress: null, lat: null, lng: null, placeApproximate: false };
  }
  if (!parsed.approximate) {
    return {
      placeName: parsed.placeName,
      placeAddress: parsed.placeAddress,
      lat: parsed.lat,
      lng: parsed.lng,
      placeApproximate: false,
    };
  }
  const unchanged =
    existing !== undefined &&
    existing.placeApproximate &&
    existing.lat === parsed.lat &&
    existing.lng === parsed.lng;
  const coords = unchanged
    ? { lat: parsed.lat, lng: parsed.lng }
    : fuzzCoords(parsed.lat, parsed.lng);
  return {
    placeName: parsed.placeName,
    placeAddress: null,
    lat: coords.lat,
    lng: coords.lng,
    placeApproximate: true,
  };
}

const createPinSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(120),
  description: z.string().trim().max(2000).optional(),
  altText: z.string().trim().max(300).optional(),
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
    altText: formData.get("altText") ?? undefined,
    link: formData.get("link") ?? "",
    width: formData.get("width"),
    height: formData.get("height"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  const intent = formData.get("status")?.toString();
  const isDraft = intent === "draft";
  const isScheduled = intent === "scheduled";
  let publishAt: Date | null = null;
  if (isScheduled) {
    const when = new Date(formData.get("publishAt")?.toString() ?? "");
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      return { ok: false, error: await errorMessage("scheduleFuture") };
    }
    publishAt = when;
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await getStorage().put(buffer, { filename: file.name, contentType: file.type });

  const place = finalizePlace(parsePlace(formData));
  const pin = await prisma.pin.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      altText:
        parsed.data.altText === undefined || parsed.data.altText === ""
          ? null
          : parsed.data.altText,
      link: parsed.data.link === "" ? null : parsed.data.link,
      placeName: place.placeName,
      placeAddress: place.placeAddress,
      lat: place.lat,
      lng: place.lng,
      placeApproximate: place.placeApproximate,
      status: isDraft ? "DRAFT" : isScheduled ? "SCHEDULED" : "PUBLISHED",
      publishAt,
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

  await embedPin(pin.id);

  if (isDraft || isScheduled) {
    const me = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    });
    revalidatePath("/");
    return redirect(
      me?.username !== null && me?.username !== undefined ? `/u/${me.username}?tab=drafts` : "/",
    );
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
  const pin = await prisma.pin.findUnique({
    where: { id: pinId },
    select: { creatorId: true, lat: true, lng: true, placeApproximate: true },
  });
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
  const place = finalizePlace(parsePlace(formData), {
    lat: pin.lat,
    lng: pin.lng,
    placeApproximate: pin.placeApproximate,
  });
  await prisma.pin.update({
    where: { id: pinId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      link: parsed.data.link === "" ? null : parsed.data.link,
      placeName: place.placeName,
      placeAddress: place.placeAddress,
      lat: place.lat,
      lng: place.lng,
      placeApproximate: place.placeApproximate,
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

/**
 * Publishes a draft or scheduled pin owned by the current user immediately,
 * clearing any scheduled time so it goes live everywhere at once.
 *
 * @param pinId - The id of the pin to publish.
 * @returns A success result, or a failure with an error message.
 */
export async function publishPinNow(
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
    return { ok: false, error: await errorMessage("editOwnPins") };
  }
  await prisma.pin.update({
    where: { id: pinId },
    data: { status: "PUBLISHED", publishAt: null },
  });
  revalidatePath("/");
  revalidatePath("/boards");
  return { ok: true };
}
