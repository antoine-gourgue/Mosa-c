/**
 * Mean Earth radius in kilometres, used by the great-circle distance.
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Converts degrees to radians.
 *
 * @param degrees - An angle in degrees.
 * @returns The angle in radians.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates, in kilometres, via the
 * haversine formula. Used to rank and filter pins by how near they are to a
 * viewer's location.
 *
 * @param aLat - First point latitude.
 * @param aLng - First point longitude.
 * @param bLat - Second point latitude.
 * @param bLng - Second point longitude.
 * @returns The distance in kilometres.
 */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
