"use client";

import { useEffect, useState } from "react";

/**
 * Viewport width (px) below which the app switches to its mobile layout. Mirrors
 * Tailwind's `sm` breakpoint, the same boundary that toggles the {@link
 * "@/components/layout".SideNav} rail and the {@link
 * "@/components/layout".BottomNav} tab bar.
 */
export const MOBILE_BREAKPOINT = 640;

/**
 * Tracks whether a CSS media query currently matches, updating live as the
 * viewport changes. Starts `false` on the server and first client render (no
 * `window`), then reflects `matchMedia` once mounted, so layout-gated UI stays
 * hydration-safe.
 *
 * @param query - A CSS media query string, e.g. `(max-width: 639.98px)`.
 * @returns True when the query matches the current viewport.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = (): void => setMatches(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

/**
 * Convenience wrapper over {@link useMediaQuery} reporting whether the viewport
 * is in the mobile range (below {@link MOBILE_BREAKPOINT}). Use it to branch
 * behaviour (not just styling) between the mobile and desktop layouts from a
 * single shared source of truth.
 *
 * @returns True on mobile-width viewports.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 0.02}px)`);
}
