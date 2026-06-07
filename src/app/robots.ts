import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * The public base URL used to build absolute metadata URLs.
 */
const BASE_URL = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * robots.txt: allow crawling of public content and disallow the private and
 * authenticated areas, and point crawlers at the sitemap.
 *
 * @returns The robots rules.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/settings",
        "/create",
        "/notifications",
        "/boards",
        "/login",
        "/sign-up",
        "/api",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
