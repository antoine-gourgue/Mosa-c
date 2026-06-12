"use server";

import { getCurrentUser } from "@/lib/auth";
import { searchPlaces as searchPlacesService } from "@/server/services/places";
import type { PlaceResult } from "@/server/services/places";

/**
 * Searches places for the pin location picker, so a creator can attach a real
 * address to a pin. Requires a signed-in user so the geocoder is never proxied
 * for anonymous traffic; resolves to an empty list when signed out or for a
 * blank query.
 *
 * @param query - The free-text place query.
 * @returns The matching place suggestions.
 */
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const user = await getCurrentUser();
  if (user === null) {
    return [];
  }
  return searchPlacesService(query);
}
