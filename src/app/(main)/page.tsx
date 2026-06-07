import { Suspense } from "react";
import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getHomeFeed, getSavedPinIds } from "@/server/services";
import type { FeedSort, FeedSource } from "@/server/services";
import { FeedFilter, FeedTabs } from "@/components/feed";
import { Landing } from "@/components/marketing";
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
 * Resolves the feed sort from the URL query.
 *
 * @param value - The raw `sort` query value.
 * @returns The feed sort, defaulting to "recent".
 */
function resolveSort(value: string | undefined): FeedSort {
  return value === "likes" || value === "downloads" || value === "comments" ? value : "recent";
}

/**
 * Fetches the first feed page and the viewer's saved ids, then renders the
 * infinite feed (or an empty state).
 *
 * @param props - The feed source and sort.
 * @param props.feed - The active feed source.
 * @param props.sort - The active feed sort.
 * @returns The populated feed.
 */
async function FeedContent({
  feed,
  sort,
}: {
  feed: FeedSource;
  sort: FeedSort;
}): Promise<ReactElement> {
  const user = await getCurrentUser();
  const [page, savedIds] = await Promise.all([
    getHomeFeed({ feed, sort, viewerId: user?.id ?? null }),
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
      key={`${feed}:${sort}`}
      initialPins={page.pins}
      initialHasMore={page.hasMore}
      savedIds={savedIds}
      viewerId={user?.id ?? null}
      feed={feed}
      sort={sort}
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
 * Home route: the masonry feed of pins with infinite scroll and a sort filter,
 * honoring the `feed` and `sort` URL parameters.
 *
 * @param props - Route props.
 * @param props.searchParams - The resolved URL search parameters.
 * @returns The home page.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ feed?: string; sort?: string }>;
}): Promise<ReactElement> {
  const { feed, sort } = await searchParams;
  const viewer = await getCurrentUser();
  if (viewer === null) {
    return <Landing />;
  }
  const source = resolveFeed(feed);
  const order = resolveSort(sort);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-line">
        <FeedTabs active={source} sort={order} />
        <div className="pb-1">
          <FeedFilter active={order} />
        </div>
      </div>
      <Suspense key={`${source}:${order}`} fallback={<FeedSkeleton />}>
        <FeedContent feed={source} sort={order} />
      </Suspense>
    </>
  );
}
