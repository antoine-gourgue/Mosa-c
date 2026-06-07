import type { ReactElement } from "react";
import { PinCardSkeleton } from "@/components/pin";

/**
 * Masonry skeleton shown while a feed-style route (home, search, boards,
 * profile) loads.
 *
 * @returns The skeleton grid.
 */
export default function Loading(): ReactElement {
  return (
    <div className="columns-2 gap-4 md:columns-4 xl:columns-6">
      {Array.from({ length: 18 }).map((_, index) => (
        <PinCardSkeleton key={index} height={180 + (index % 4) * 70} />
      ))}
    </div>
  );
}
