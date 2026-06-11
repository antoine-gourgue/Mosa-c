import { prisma } from "@/lib/prisma";
import type { Pin, Tag, TagWithCount } from "@/types/domain";
import { PIN_INCLUDE, toPin, toTag } from "./mappers";

/**
 * Fetches the most-used tags for the discovery grid, busiest first.
 *
 * @param limit - The maximum number of tags to return.
 * @returns The popular tags with their pin counts.
 */
export async function getPopularTags(limit = 24): Promise<TagWithCount[]> {
  const rows = await prisma.tag.findMany({
    include: { _count: { select: { pins: true } } },
    orderBy: [{ pins: { _count: "desc" } }, { name: "asc" }],
    take: limit,
  });
  return rows.map((tag) => ({
    id: tag.id,
    slug: tag.slug,
    name: tag.name,
    pinCount: tag._count.pins,
  }));
}

/**
 * Searches tags by name (case-insensitive), busiest first, for the interest
 * picker so it scales past the popular shortlist. Returns an empty list for a
 * blank query.
 *
 * @param query - The partial tag name.
 * @param limit - The maximum number of matches.
 * @returns The matching tags.
 */
export async function searchTags(query: string, limit = 40): Promise<Tag[]> {
  const q = query.trim();
  if (q === "") {
    return [];
  }
  const rows = await prisma.tag.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    orderBy: [{ pins: { _count: "desc" } }, { name: "asc" }],
    take: limit,
  });
  return rows.map(toTag);
}

/**
 * Fetches a tag by its slug.
 *
 * @param slug - The tag slug.
 * @returns The tag, or null when it does not exist.
 */
export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const row = await prisma.tag.findUnique({ where: { slug } });
  return row === null ? null : toTag(row);
}

/**
 * Fetches the pins carrying a given tag, newest first.
 *
 * @param slug - The tag slug.
 * @returns The pins with that tag.
 */
export async function getPinsByTag(slug: string): Promise<Pin[]> {
  const rows = await prisma.pin.findMany({
    where: { tags: { some: { tag: { slug } } } },
    include: PIN_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPin);
}
