import { describe, expect, it, vi } from "vitest";
import { createPlaceSearch } from "./places";

/**
 * Builds a fetch stub returning a successful JSON response with the given body.
 */
function okJson(body: unknown): typeof fetch {
  return vi.fn(async () => ({ ok: true, json: async () => body }) as unknown as Response);
}

const sample = [
  {
    name: "Café de Flore",
    display_name: "Café de Flore, 172, Bd Saint-Germain, Paris",
    lat: "48.854",
    lon: "2.333",
  },
];

describe("createPlaceSearch", () => {
  it("returns nothing and skips the network for a too-short query", async () => {
    const fetchImpl = okJson(sample);
    const search = createPlaceSearch({ fetchImpl });
    expect(await search("ab")).toEqual([]);
    expect(await search("  ")).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps a Nominatim response into clean suggestions", async () => {
    const search = createPlaceSearch({ fetchImpl: okJson(sample), minIntervalMs: 0 });
    expect(await search("flore")).toEqual([
      {
        name: "Café de Flore",
        address: "172, Bd Saint-Germain, Paris",
        lat: 48.854,
        lng: 2.333,
      },
    ]);
  });

  it("shortens an overly long address and drops a leading segment that repeats the name", async () => {
    const fetchImpl = okJson([
      {
        name: "Stade de France",
        display_name:
          "Stade de France, Avenue du Stade de France, Saint-Denis, Seine-Saint-Denis, Île-de-France, France, 93200",
        lat: "48.92",
        lon: "2.36",
      },
    ]);
    const search = createPlaceSearch({ fetchImpl, minIntervalMs: 0 });
    const [place] = await search("stade");
    expect(place?.address).toBe("Avenue du Stade de France, Saint-Denis, Seine-Saint-Denis");
  });

  it("falls back to the first address segment when there is no name", async () => {
    const fetchImpl = okJson([
      { display_name: "172, Bd Saint-Germain, Paris", lat: "48.8", lon: "2.3" },
    ]);
    const search = createPlaceSearch({ fetchImpl, minIntervalMs: 0 });
    const [place] = await search("germain");
    expect(place?.name).toBe("172");
  });

  it("drops entries without finite coordinates or a label and honours the limit", async () => {
    const fetchImpl = okJson([
      { name: "No coords", lon: "2.3" },
      { name: "No label", lat: "1", lon: "2", display_name: "" },
      { name: "A", display_name: "A", lat: "1", lon: "1" },
      { name: "B", display_name: "B", lat: "2", lon: "2" },
    ]);
    const search = createPlaceSearch({ fetchImpl, minIntervalMs: 0, limit: 1 });
    const results = await search("query");
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("A");
  });

  it("caches identical queries so the geocoder is hit once", async () => {
    const fetchImpl = okJson(sample);
    const search = createPlaceSearch({ fetchImpl, minIntervalMs: 0 });
    await search("Flore");
    await search("flore");
    await search("  FLORE ");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("sends an identifying User-Agent and the expected query", async () => {
    const fetchImpl = okJson(sample);
    const search = createPlaceSearch({ fetchImpl, minIntervalMs: 0, endpoint: "https://geo.test" });
    await search("café & bar");
    const [url, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(url).toContain("https://geo.test?q=caf%C3%A9%20%26%20bar");
    expect((init.headers as Record<string, string>)["User-Agent"]).toContain("Mosaic");
  });

  it("degrades to an empty list on a non-ok response", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false }) as unknown as Response);
    const search = createPlaceSearch({ fetchImpl, minIntervalMs: 0 });
    expect(await search("paris")).toEqual([]);
  });

  it("degrades to an empty list when the request throws", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const search = createPlaceSearch({ fetchImpl, minIntervalMs: 0 });
    expect(await search("paris")).toEqual([]);
  });

  it("waits with the real default timer between calls", async () => {
    const search = createPlaceSearch({ fetchImpl: okJson(sample), minIntervalMs: 12 });
    await search("first");
    const start = Date.now();
    await search("second");
    expect(Date.now() - start).toBeGreaterThanOrEqual(8);
  });

  it("aborts and yields nothing when the geocoder exceeds the timeout", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          (init.signal as AbortSignal).addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
    ) as unknown as typeof fetch;
    const search = createPlaceSearch({ fetchImpl, minIntervalMs: 0, timeoutMs: 5 });
    expect(await search("paris")).toEqual([]);
  });

  it("spaces consecutive geocoder calls by the configured interval", async () => {
    let clock = 10_000;
    const now = (): number => clock;
    const sleep = vi.fn(async (ms: number) => {
      clock += ms;
    });
    const search = createPlaceSearch({
      fetchImpl: okJson(sample),
      now,
      sleepImpl: sleep,
      minIntervalMs: 1_000,
    });
    await search("first");
    expect(sleep).not.toHaveBeenCalled();
    await search("second");
    expect(sleep).toHaveBeenCalledExactlyOnceWith(1_000);
  });
});
