"use server";

import { getCurrentUser } from "@/lib/auth";
import { getHomeFeed, getLikedPinIds, getNearbyPins, getSavedPinIds } from "@/server/services";
import type { FeedPage, FeedSort, FeedSource } from "@/server/services";
import type { Pin } from "@/types/domain";

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

/**
 * The result of a "near you" lookup: the nearby pins (nearest first) and the
 * viewer's saved/liked ids so the feed renders the right toggle states.
 */
export type NearbyResult = {
  ok: boolean;
  pins: Pin[];
  savedIds: string[];
  likedIds: string[];
};

/**
 * Loads geotagged pins near the viewer's browser-reported coordinates, for the
 * "near you" discovery section. Validates the coordinates and degrades to an
 * empty, not-ok result when they are out of range. Works signed-out (no saved or
 * liked ids).
 *
 * @param lat - The viewer's latitude.
 * @param lng - The viewer's longitude.
 * @returns The nearby pins and the viewer's saved/liked ids.
 */
export async function loadNearbyPins(lat: number, lng: number): Promise<NearbyResult> {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return { ok: false, pins: [], savedIds: [], likedIds: [] };
  }
  const user = await getCurrentUser();
  const [pins, savedIds, likedIds] = await Promise.all([
    getNearbyPins(user?.id ?? null, lat, lng),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
    user === null ? Promise.resolve<string[]>([]) : getLikedPinIds(user.id),
  ]);
  return { ok: true, pins, savedIds, likedIds };
}
