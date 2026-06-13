import { prisma } from "@/lib/prisma";
import { publishedPinWhere } from "./pins";

/**
 * Public URLs to include in the sitemap.
 */
export type SitemapEntries = {
  pins: { id: string; createdAt: Date }[];
  profiles: { username: string }[];
};

/**
 * Lists the publicly indexable pins and profiles for the sitemap.
 *
 * @returns The pin ids (with timestamps) and public usernames.
 */
export async function getSitemapEntries(): Promise<SitemapEntries> {
  const [pins, profiles] = await Promise.all([
    prisma.pin.findMany({
      where: publishedPinWhere(),
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    prisma.user.findMany({
      where: { username: { not: null }, disabled: false },
      select: { username: true },
      take: 5000,
    }),
  ]);
  return {
    pins,
    profiles: profiles.filter(
      (profile): profile is { username: string } => profile.username !== null,
    ),
  };
}
