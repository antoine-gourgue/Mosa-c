"use server";

import { getCurrentUser } from "@/lib/auth";
import { getHomeFeed } from "@/server/services";
import type { FeedPage, FeedSort, FeedSource } from "@/server/services";

/**
 * Loads the next page of the home feed for the given source and sort, resolving
 * the viewer for the "following" source.
 *
 * @param params - The offset, feed source and sort order.
 * @returns The next page of pins and whether more remain.
 */
export async function loadMoreFeed(params: {
  skip: number;
  feed: FeedSource;
  sort: FeedSort;
}): Promise<FeedPage> {
  const user = await getCurrentUser();
  return getHomeFeed({
    skip: params.skip,
    feed: params.feed,
    sort: params.sort,
    viewerId: user?.id ?? null,
  });
}
