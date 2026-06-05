import Image from "next/image";
import type { ReactElement } from "react";

const MOSAIC_IMAGES = [
  "orchid",
  "andromeda",
  "fox",
  "car",
  "design",
  "starburst",
  "artflowers",
  "photography",
  "galaxy",
];

/**
 * Decorative left-hand visual panel for the auth screens: a rotated, scaled
 * three-column photo mosaic fading into the form on the right. Hidden on small
 * screens.
 *
 * @returns The mosaic panel element.
 */
export function AuthMosaic(): ReactElement {
  const tiles = [...MOSAIC_IMAGES, ...MOSAIC_IMAGES];
  return (
    <div className="relative hidden flex-1 overflow-hidden bg-surface lg:block" aria-hidden="true">
      <div className="absolute inset-0 grid -rotate-6 scale-125 grid-cols-3 gap-3 p-3">
        {tiles.map((name, index) => (
          <div
            key={`${name}-${index}`}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl"
          >
            <Image src={`/images/${name}.png`} alt="" fill sizes="25vw" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-bg" />
    </div>
  );
}
