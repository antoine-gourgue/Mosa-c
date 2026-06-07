import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web app manifest making Mosaic installable as a PWA, with the brand name,
 * colours and icon.
 *
 * @returns The web app manifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e60023",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
