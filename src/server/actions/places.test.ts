import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/server/services/places", () => ({ searchPlaces: vi.fn() }));

import { getCurrentUser } from "@/lib/auth";
import { searchPlaces as searchPlacesService } from "@/server/services/places";
import { searchPlaces } from "./places";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchPlaces action", () => {
  it("returns nothing when signed out and never hits the geocoder", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await searchPlaces("paris")).toEqual([]);
    expect(searchPlacesService).not.toHaveBeenCalled();
  });

  it("delegates to the place service for a signed-in user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    const places = [{ name: "Paris", address: "Paris, France", lat: 48.85, lng: 2.35 }];
    vi.mocked(searchPlacesService).mockResolvedValue(places);
    expect(await searchPlaces("paris")).toBe(places);
    expect(searchPlacesService).toHaveBeenCalledWith("paris");
  });
});
