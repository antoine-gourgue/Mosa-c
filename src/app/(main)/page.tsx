import { Suspense } from "react";
import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getHomeFeed, getSavedPinIds } from "@/server/services";
import type { FeedSource } from "@/server/services";
import { InfiniteFeed, PinCardSkeleton } from "@/components/pin";

/**
 * Resolves the feed source from the URL query.
 *
 * @param value - The raw `feed` query value.
 * @returns The feed source, defaulting to "foryou".
 */
function resolveFeed(value: string | undefined): FeedSource {
  return value === "following" ? "following" : "foryou";
}

/**
 * Fetches the first feed page and the viewer's saved ids, then renders the
 * infinite feed (or an empty state).
 *
 * @param props - The active category slug and feed source.
 * @param props.category - The active category slug, or null for all.
 * @param props.feed - The active feed source.
 * @returns The populated feed.
 */
async function FeedContent({
  category,
  feed,
}: {
  category: string | null;
  feed: FeedSource;
}): Promise<ReactElement> {
  const user = await getCurrentUser();
  const [page, savedIds] = await Promise.all([
    getHomeFeed({ category, feed, viewerId: user?.id ?? null }),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
  ]);

  if (page.pins.length === 0) {
    return (
      <p className="py-24 text-center text-ink-soft">
        {feed === "following"
          ? "No pins from people you follow yet — follow some creators to fill this feed."
          : "No pins to show here yet."}
      </p>
    );
  }

  return (
    <InfiniteFeed
      key={`${feed}:${category ?? "all"}`}
      initialPins={page.pins}
      initialCursor={page.nextCursor}
      savedIds={savedIds}
      viewerId={user?.id ?? null}
      category={category}
      feed={feed}
    />
  );
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
 * Home route: the masonry feed of pins with infinite scroll, honoring the
 * `category` and `feed` URL parameters.
 *
 * @param props - Route props.
 * @param props.searchParams - The resolved URL search parameters.
 * @returns The home page.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; feed?: string }>;
}): Promise<ReactElement> {
  const { category, feed } = await searchParams;
  const activeCategory = category ?? null;
  const source = resolveFeed(feed);

  return (
    <Suspense key={`${source}:${activeCategory ?? "all"}`} fallback={<FeedSkeleton />}>
      <FeedContent category={activeCategory} feed={source} />
    </Suspense>
  );
}
