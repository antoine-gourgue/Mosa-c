# Animation

Motion is built with [GSAP](https://gsap.com/) via the React integration.

## Setup

All animation code imports from `@/lib/gsap`, which registers the plugins once
(`useGSAP`, `Flip`) and exports `gsap`, `useGSAP`, `Flip`, the `REDUCED_MOTION`
media query and shared `DURATION` tokens.

## Principles

- **Use `useGSAP`** (not raw `useEffect`) in client components so tweens are
  scoped and reverted automatically on unmount — no leaks.
- **Respect reduced motion.** Wrap animations in `gsap.matchMedia()` and provide
  a non-animated fallback for `REDUCED_MOTION`; data and content must be readable
  immediately.
- **Transforms and opacity only** (`x`, `y`, `scale`, `opacity`) — never animate
  `width`/`height`/`top`/`left`, to avoid layout thrashing and CLS.
- **Timing**: micro-interactions `DURATION.fast`–`DURATION.base` (150–250ms),
  larger transitions ≤ `DURATION.slow` (400ms); ease-out on enter, ease-in on
  exit; exits shorter than enters.
- **Restraint**: animate one or two key elements per view; stagger lists by
  ~30–50ms per item.

## Example

```tsx
"use client";
import { useRef } from "react";
import { gsap, useGSAP, REDUCED_MOTION, DURATION } from "@/lib/gsap";

export function Example(): React.ReactElement {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`(prefers-reduced-motion: no-preference)`, () => {
        gsap.from(".item", {
          y: 16,
          opacity: 0,
          duration: DURATION.base,
          stagger: 0.04,
          ease: "power2.out",
        });
      });
      mm.add(REDUCED_MOTION, () => {
        gsap.set(".item", { opacity: 1, y: 0 });
      });
    },
    { scope: root },
  );
  return <div ref={root} />;
}
```
