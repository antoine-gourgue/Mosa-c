import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { SITE } from "@/lib/site";

/**
 * Open Graph image dimensions.
 */
export const size = { width: 1200, height: 630 };

/**
 * Open Graph image content type.
 */
export const contentType = "image/png";

/**
 * Alt text for the Open Graph image.
 */
export const alt = SITE.name;

/**
 * Default branded Open Graph image used across the app for routes that do not
 * provide their own. Routes such as a pin override this with their own image.
 *
 * @returns The generated image response.
 */
export default function OpengraphImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "#e60023",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -2 }}>{SITE.name}</div>
        <div style={{ fontSize: 40, opacity: 0.9 }}>{SITE.description}</div>
      </div>
    ) as ReactElement,
    size,
  );
}
