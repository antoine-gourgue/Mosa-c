import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/server/services", () => ({
  getHomeFeed: vi.fn(),
  getNearbyPins: vi.fn(),
  getSavedPinIds: vi.fn(),
  getLikedPinIds: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth";
import { getHomeFeed, getLikedPinIds, getNearbyPins, getSavedPinIds } from "@/server/services";
import { loadMoreFeed, loadNearbyPins } from "./feed";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getHomeFeed).mockResolvedValue({ pins: [], hasMore: false } as never);
  vi.mocked(getNearbyPins).mockResolvedValue([]);
  vi.mocked(getSavedPinIds).mockResolvedValue([]);
  vi.mocked(getLikedPinIds).mockResolvedValue([]);
});

describe("loadMoreFeed", () => {
  it("passes the viewer id when signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    await loadMoreFeed({ skip: 20, feed: "following", sort: "recent" } as never);
    expect(getHomeFeed).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, feed: "following", sort: "recent", viewerId: "u1" }),
    );
  });

  it("passes a null viewer id when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await loadMoreFeed({ skip: 0, feed: "all", sort: "popular" } as never);
    expect(getHomeFeed).toHaveBeenCalledWith(expect.objectContaining({ viewerId: null }));
  });
});

describe("loadNearbyPins", () => {
  it("rejects out-of-range coordinates without querying", async () => {
    const result = await loadNearbyPins(200, 2.35);
    expect(result).toEqual({ ok: false, pins: [], savedIds: [], likedIds: [] });
    expect(getNearbyPins).not.toHaveBeenCalled();
  });

  it("loads nearby pins and the viewer's saved/liked ids when signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
    vi.mocked(getNearbyPins).mockResolvedValue([{ id: "p1" }] as never);
    vi.mocked(getSavedPinIds).mockResolvedValue(["p1"]);
    const result = await loadNearbyPins(48.85, 2.35);
    expect(getNearbyPins).toHaveBeenCalledWith("u1", 48.85, 2.35);
    expect(result).toEqual({ ok: true, pins: [{ id: "p1" }], savedIds: ["p1"], likedIds: [] });
  });

  it("works signed out with no saved or liked ids", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const result = await loadNearbyPins(48.85, 2.35);
    expect(getNearbyPins).toHaveBeenCalledWith(null, 48.85, 2.35);
    expect(getSavedPinIds).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
  });
});
