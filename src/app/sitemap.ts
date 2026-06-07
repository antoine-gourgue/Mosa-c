import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getSitemapEntries } from "@/server/services";

/**
 * The public base URL used to build absolute metadata URLs.
 */
const BASE_URL = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Sitemap of the publicly indexable routes: the home, every pin and every
 * public profile.
 *
 * @returns The sitemap entries.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pins, profiles } = await getSitemapEntries();
  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    ...pins.map((pin) => ({
      url: `${BASE_URL}/pin/${pin.id}`,
      lastModified: pin.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...profiles.map((profile) => ({
      url: `${BASE_URL}/u/${profile.username}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
