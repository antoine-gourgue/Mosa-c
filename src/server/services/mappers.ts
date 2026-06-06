import type { Board, Category, Creator, Pin } from "@/types/domain";

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
};

/**
 * Structural shape of a category row read from the database.
 */
export type CategoryRow = {
  id: string;
  slug: string;
  label: string;
  imageUrl: string;
};

/**
 * Structural shape of a pin row (with relations) read from the database.
 */
export type PinRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  width: number;
  height: number;
  link: string | null;
  creator: CreatorRow;
  category: CategoryRow | null;
};

/**
 * Structural shape of a board row (with pin count) read from the database.
 */
export type BoardRow = {
  id: string;
  name: string;
  isDefault: boolean;
  _count: { pins: number };
};

/**
 * Prisma include selecting a pin's creator and category.
 */
export const PIN_INCLUDE = { creator: true, category: true } as const;

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
  };
}

/**
 * Maps a category row to the UI category type.
 *
 * @param row - The category row.
 * @returns The mapped category.
 */
export function toCategory(row: CategoryRow): Category {
  return { id: row.id, slug: row.slug, label: row.label, imageUrl: row.imageUrl };
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
    imageUrl: row.imageUrl,
    width: row.width,
    height: row.height,
    link: row.link,
    creator: toCreator(row.creator),
    category: row.category === null ? null : toCategory(row.category),
  };
}

/**
 * Maps a board row (with pin count) to the UI board type.
 *
 * @param row - The board row.
 * @returns The mapped board.
 */
export function toBoard(row: BoardRow): Board {
  return { id: row.id, name: row.name, isDefault: row.isDefault, pinCount: row._count.pins };
}
