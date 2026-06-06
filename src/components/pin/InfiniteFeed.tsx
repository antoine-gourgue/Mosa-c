"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Spinner } from "@/components/ui";
import { loadMoreFeed } from "@/server/actions/feed";
import type { FeedSource } from "@/server/services";
import type { Pin } from "@/types/domain";
import { PinFeed } from "./PinFeed";

/**
 * Props for the {@link InfiniteFeed} component.
 */
export type InfiniteFeedProps = {
  initialPins: Pin[];
  initialCursor: string | null;
  savedIds: string[];
  viewerId: string | null;
  category: string | null;
  feed: FeedSource;
};

/**
 * Client feed that renders an initial page of pins and appends more as the user
 * scrolls, using an IntersectionObserver sentinel and the loadMoreFeed action.
 * Reset across feed sources by keying this component on the source.
 *
 * @param props - The initial page, cursor, saved ids, viewer and feed source.
 * @returns The infinite feed element.
 */
export function InfiniteFeed({
  initialPins,
  initialCursor,
  savedIds,
  viewerId,
  category,
  feed,
}: InfiniteFeedProps): ReactElement {
  const [pins, setPins] = useState<Pin[]>(initialPins);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async (): Promise<void> => {
    if (loadingRef.current || cursor === null) {
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await loadMoreFeed({ cursor, category, feed });
      setPins((previous) => [...previous, ...page.pins]);
      setCursor(page.nextCursor);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor, category, feed]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (element === null || cursor === null) {
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
  }, [loadMore, cursor]);

  return (
    <>
      <PinFeed pins={pins} savedIds={savedIds} viewerId={viewerId} />
      {cursor !== null ? <div ref={sentinelRef} className="h-10" aria-hidden /> : null}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : null}
    </>
  );
}
