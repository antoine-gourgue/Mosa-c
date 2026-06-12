import type { Board, Creator, Pin, PinPlace, Tag } from "@/types/domain";

/**
 * Structural shape of a creator row read from the database.
 */
export type CreatorRow = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followersLabel: string | null;
  verified: boolean;
  isPrivate?: boolean;
};

/**
 * Structural shape of a tag row read from the database.
 */
export type TagRow = {
  id: string;
  slug: string;
  name: string;
};

/**
 * Structural shape of a pin row (with relations) read from the database.
 */
export type PinRow = {
  id: string;
  title: string;
  description: string | null;
  altText: string | null;
  imageUrl: string;
  width: number;
  height: number;
  link: string | null;
  placeName: string | null;
  placeAddress: string | null;
  lat: number | null;
  lng: number | null;
  placeApproximate: boolean;
  downloadCount: number;
  creator: CreatorRow;
  tags: { tag: TagRow }[];
  _count: { likes: number; comments: number };
};

/**
 * Structural shape of a board row (with pin count) read from the database.
 */
export type BoardRow = {
  id: string;
  name: string;
  description: string | null;
  visibility: "PUBLIC" | "SECRET";
  isDefault: boolean;
  _count: { pins: number };
};

/**
 * Prisma include selecting a pin's creator and tags.
 */
export const PIN_INCLUDE = {
  creator: true,
  tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
  _count: { select: { likes: true, comments: true } },
} as const;

/**
 * Maps a creator row to the UI creator type.
 *
 * @param row - The creator row.
 * @returns The mapped creator.
 */
export function toCreator(row: CreatorRow): Creator {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    followersLabel: row.followersLabel,
    verified: row.verified,
    isPrivate: row.isPrivate ?? false,
  };
}

/**
 * Maps a tag row to the UI tag type.
 *
 * @param row - The tag row.
 * @returns The mapped tag.
 */
export function toTag(row: TagRow): Tag {
  return { id: row.id, slug: row.slug, name: row.name };
}

/**
 * Builds the geotagged place from a pin row, or null when the pin has no
 * coordinates. A place is only surfaced once both its name and coordinates are
 * present, so half-saved rows never render a broken map.
 *
 * @param row - The pin row.
 * @returns The mapped place, or null.
 */
function toPlace(row: PinRow): PinPlace | null {
  if (row.placeName === null || row.lat === null || row.lng === null) {
    return null;
  }
  return {
    name: row.placeName,
    address: row.placeAddress,
    lat: row.lat,
    lng: row.lng,
    approximate: row.placeApproximate,
  };
}

/**
 * Maps a pin row (with relations) to the UI pin type.
 *
 * @param row - The pin row.
 * @returns The mapped pin.
 */
export function toPin(row: PinRow): Pin {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    altText: row.altText,
    imageUrl: row.imageUrl,
    width: row.width,
    height: row.height,
    link: row.link,
    place: toPlace(row),
    creator: toCreator(row.creator),
    tags: row.tags.map((pinTag) => toTag(pinTag.tag)),
    likeCount: row._count.likes,
    commentCount: row._count.comments,
    downloadCount: row.downloadCount,
  };
}

/**
 * Maps a board row (with pin count) to the UI board type.
 *
 * @param row - The board row.
 * @returns The mapped board.
 */
export function toBoard(row: BoardRow): Board {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    visibility: row.visibility,
    isDefault: row.isDefault,
    pinCount: row._count.pins,
  };
}
