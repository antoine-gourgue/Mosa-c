"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tracks the user's reduced-motion preference, updating live if it changes.
 * Starts conservative (false) on the server and first client render, then
 * reflects `matchMedia` once mounted, so motion-gated UI (e.g. video pin
 * hover autoplay) can honour the system setting.
 *
 * @returns True when the user prefers reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const sync = (): void => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}
