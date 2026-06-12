/**
 * Place search backed by OpenStreetMap's Nominatim geocoder — free and
 * keyless, which suits this project. The geocoder is rate-limited to ~1 req/s
 * and requires an identifying User-Agent, so calls are serialized, spaced out
 * and cached here. The `fetchImpl`, `now` and `sleepImpl` knobs are injectable
 * so the search can be unit-tested without real network or timers.
 */

/**
 * A geocoded place suggestion: a short label, the full formatted address and
 * the coordinates used to pin it on a map.
 */
export type PlaceResult = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

/**
 * A place-search function: maps a free-text query to ranked suggestions.
 */
export type PlaceSearch = (query: string) => Promise<PlaceResult[]>;

/**
 * Configuration for {@link createPlaceSearch}.
 */
export type PlaceSearchConfig = {
  fetchImpl?: typeof fetch;
  now?: () => number;
  sleepImpl?: (ms: number) => Promise<void>;
  minIntervalMs?: number;
  timeoutMs?: number;
  endpoint?: string;
  limit?: number;
};

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Mosaic/1.0 (place search)";
const MIN_QUERY_LENGTH = 3;
const DEFAULT_LIMIT = 5;
const DEFAULT_MIN_INTERVAL_MS = 1_000;
const DEFAULT_TIMEOUT_MS = 8_000;
const CACHE_MAX = 200;

/**
 * Sleeps for the given number of milliseconds.
 *
 * @param ms - The delay in milliseconds.
 * @returns A promise that resolves after the delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Trims a Nominatim `display_name` (which can run to nine comma-separated
 * segments) down to a short, readable address: the leading segment is dropped
 * when it merely repeats the place name, and at most the next three segments are
 * kept.
 *
 * @param display - The full Nominatim display name.
 * @param name - The resolved place name.
 * @returns The shortened address.
 */
function shortenAddress(display: string, name: string): string {
  const parts = display
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  const start = parts[0] === name ? 1 : 0;
  return parts.slice(start, start + 3).join(", ");
}

/**
 * Parses a Nominatim JSON response into clean place suggestions, dropping any
 * entry without finite coordinates or a label and capping at the limit.
 *
 * @param data - The parsed JSON response.
 * @param limit - The maximum number of suggestions to keep.
 * @returns The mapped suggestions.
 */
function parsePlaces(data: unknown, limit: number): PlaceResult[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const out: PlaceResult[] = [];
  for (const raw of data) {
    const item = raw as { lat?: unknown; lon?: unknown; display_name?: unknown; name?: unknown };
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    const display = typeof item.display_name === "string" ? item.display_name.trim() : "";
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || display === "") {
      continue;
    }
    const named = typeof item.name === "string" ? item.name.trim() : "";
    const name = named !== "" ? named : (display.split(",")[0] ?? display).trim();
    out.push({ name, address: shortenAddress(display, name), lat, lng });
    if (out.length >= limit) {
      break;
    }
  }
  return out;
}

/**
 * Builds a place-search function bound to its own cache and rate-limit gate, so
 * concurrent callers are serialized and spaced by `minIntervalMs`. Blank or
 * too-short queries resolve to an empty list without a network call, and any
 * network or parse failure degrades to an empty list rather than throwing.
 *
 * @param config - Injectable fetch, clock and spacing knobs.
 * @returns The place-search function.
 */
export function createPlaceSearch(config: PlaceSearchConfig = {}): PlaceSearch {
  const fetchImpl = config.fetchImpl ?? fetch;
  const now = config.now ?? Date.now;
  const sleep = config.sleepImpl ?? delay;
  const minIntervalMs = config.minIntervalMs ?? DEFAULT_MIN_INTERVAL_MS;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const endpoint = config.endpoint ?? NOMINATIM_ENDPOINT;
  const limit = config.limit ?? DEFAULT_LIMIT;
  const cache = new Map<string, PlaceResult[]>();
  let lastCall = 0;
  let gate: Promise<unknown> = Promise.resolve();

  const fetchPlaces = async (query: string): Promise<PlaceResult[]> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `${endpoint}?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=${limit}`;
      const response = await fetchImpl(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      if (!response.ok) {
        return [];
      }
      return parsePlaces(await response.json(), limit);
    } catch {
      return [];
    } finally {
      clearTimeout(timer);
    }
  };

  return async (query: string): Promise<PlaceResult[]> => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return [];
    }
    const key = trimmed.toLowerCase();
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const run = async (): Promise<PlaceResult[]> => {
      const wait = lastCall + minIntervalMs - now();
      if (wait > 0) {
        await sleep(wait);
      }
      lastCall = now();
      return fetchPlaces(trimmed);
    };
    const result = gate.then(run, run);
    gate = result;
    const places = await result;
    if (cache.size >= CACHE_MAX) {
      cache.clear();
    }
    cache.set(key, places);
    return places;
  };
}

/**
 * The shared place search used by the place actions, backed by live Nominatim.
 */
export const searchPlaces: PlaceSearch = createPlaceSearch();
