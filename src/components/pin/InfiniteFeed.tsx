"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Spinner } from "@/components/ui";
import { loadMoreFeed } from "@/server/actions/feed";
import type { FeedSort, FeedSource } from "@/server/services";
import type { Pin } from "@/types/domain";
import { PinFeed } from "./PinFeed";

/**
 * Props for the {@link InfiniteFeed} component.
 */
export type InfiniteFeedProps = {
  initialPins: Pin[];
  initialHasMore: boolean;
  savedIds: string[];
  viewerId: string | null;
  feed: FeedSource;
  sort: FeedSort;
};

/**
 * Client feed that renders an initial page of pins and appends more as the user
 * scrolls, using an IntersectionObserver sentinel and the loadMoreFeed action.
 * Reset across feed sources and sorts by keying this component on them.
 *
 * @param props - The initial page, saved ids, viewer, feed source and sort.
 * @returns The infinite feed element.
 */
export function InfiniteFeed({
  initialPins,
  initialHasMore,
  savedIds,
  viewerId,
  feed,
  sort,
}: InfiniteFeedProps): ReactElement {
  const [pins, setPins] = useState<Pin[]>(initialPins);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async (): Promise<void> => {
    if (loadingRef.current || !hasMore) {
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await loadMoreFeed({ skip: pins.length, feed, sort });
      setPins((previous) => [...previous, ...page.pins]);
      setHasMore(page.hasMore);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, pins.length, feed, sort]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (element === null || !hasMore) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting === true) {
          void loadMore();
        }
      },
      { rootMargin: "800px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  return (
    <>
      <PinFeed pins={pins} savedIds={savedIds} viewerId={viewerId} />
      {hasMore ? <div ref={sentinelRef} className="h-10" aria-hidden /> : null}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : null}
    </>
  );
}
