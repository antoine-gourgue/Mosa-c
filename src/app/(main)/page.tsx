import { Suspense } from "react";
import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getPins, getSavedPinIds } from "@/server/services";
import { PinCardSkeleton, PinFeed } from "@/components/pin";

/**
 * Fetches the feed pins and the current user's saved ids, then renders them.
 *
 * @returns The populated feed.
 */
async function FeedContent(): Promise<ReactElement> {
  const user = await getCurrentUser();
  const [pins, savedIds] = await Promise.all([
    getPins(),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
  ]);
  return <PinFeed pins={pins} savedIds={savedIds} viewerId={user?.id ?? null} />;
}

/**
 * Placeholder masonry of skeletons shown while the feed loads.
 *
 * @returns The skeleton grid.
 */
function FeedSkeleton(): ReactElement {
  return (
    <div className="columns-2 gap-4 md:columns-4 xl:columns-6">
      {Array.from({ length: 18 }).map((_, index) => (
        <PinCardSkeleton key={index} height={180 + (index % 4) * 70} />
      ))}
    </div>
  );
}

/**
 * Home route: the masonry feed of pins.
 *
 * @returns The home page.
 */
export default function HomePage(): ReactElement {
  return (
    <Suspense fallback={<FeedSkeleton />}>
      <FeedContent />
    </Suspense>
  );
}
