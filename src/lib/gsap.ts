import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(useGSAP, Flip);

/**
 * Media query matching users who have requested reduced motion. Use with
 * `gsap.matchMedia()` to provide a non-animated fallback.
 */
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Shared animation timing tokens (seconds) so motion feels consistent.
 */
export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

export { gsap, useGSAP, Flip };
