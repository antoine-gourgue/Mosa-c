import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/server/services", () => ({ getHomeFeed: vi.fn() }));

import { getCurrentUser } from "@/lib/auth";
import { getHomeFeed } from "@/server/services";
import { loadMoreFeed } from "./feed";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getHomeFeed).mockResolvedValue({ pins: [], hasMore: false } as never);
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
