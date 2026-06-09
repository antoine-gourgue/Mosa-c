import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web app manifest making Mosaic installable as a standalone desktop (and
 * mobile) app. PNG icons at 192 and 512 plus a maskable variant satisfy the
 * browsers' install criteria; they live under `/brand` so the auth proxy serves
 * them without authentication.
 *
 * @returns The web app manifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "en",
    categories: ["lifestyle", "photo", "social"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/brand/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/brand/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
