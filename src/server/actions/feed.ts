"use server";

import { getCurrentUser } from "@/lib/auth";
import { getHomeFeed } from "@/server/services";
import type { FeedPage, FeedSource } from "@/server/services";

/**
 * Loads the next page of the home feed for the given source and category,
 * resolving the viewer for the "following" source.
 *
 * @param params - The cursor, category slug and feed source.
 * @returns The next page of pins and cursor.
 */
export async function loadMoreFeed(params: {
  cursor: string | null;
  category: string | null;
  feed: FeedSource;
}): Promise<FeedPage> {
  const user = await getCurrentUser();
  return getHomeFeed({
    cursor: params.cursor,
    category: params.category,
    feed: params.feed,
    viewerId: user?.id ?? null,
  });
}
