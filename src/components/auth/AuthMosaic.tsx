"use client";

import Image from "next/image";
import { useRef } from "react";
import type { ReactElement } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const MOSAIC_IMAGES = [
  "1501785888041-af3ef285b470",
  "1506905925346-21bda4d32df4",
  "1441974231531-c6227db76b6e",
  "1502602898657-3e91760cbb34",
  "1542051841857-5f90071e7989",
  "1480714378408-67cf0d13bc1b",
  "1518791841217-8f162f1e1131",
  "1504674900247-0877df9cc836",
  "1493246507139-91e8fad9978e",
].map((id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&h=533&q=70`);

/**
 * Decorative left-hand visual panel for the auth screens: a rotated, scaled
 * three-column photo mosaic with a slow vertical drift, fading into the form on
 * the right. The drift is disabled when reduced motion is requested. Hidden on
 * small screens.
 *
 * @returns The mosaic panel element.
 */
export function AuthMosaic(): ReactElement {
  const tiles = [...MOSAIC_IMAGES, ...MOSAIC_IMAGES];
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(gridRef.current, {
          yPercent: -6,
          duration: 16,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    },
    { scope: gridRef },
  );

  return (
    <div className="relative hidden flex-1 overflow-hidden bg-surface lg:block" aria-hidden="true">
      <div className="absolute inset-0 -rotate-6 scale-125">
        <div ref={gridRef} className="grid grid-cols-3 gap-3 p-3">
          {tiles.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl"
            >
              <Image src={src} alt="" fill sizes="25vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg" />
    </div>
  );
}
