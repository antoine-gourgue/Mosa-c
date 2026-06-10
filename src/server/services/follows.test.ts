import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    follow: { findMany: vi.fn(), findUnique: vi.fn() },
    followRequest: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getFollowState,
  getFollowedCreatorIds,
  getPendingFollowRequestCount,
  getPendingFollowRequests,
  isFollowing,
} from "./follows";

const db = prisma as unknown as {
  follow: { findMany: Mock; findUnique: Mock };
  followRequest: { findUnique: Mock; findMany: Mock; count: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getFollowedCreatorIds", () => {
  it("returns the followed creator ids", async () => {
    db.follow.findMany.mockResolvedValue([{ creatorId: "a" }, { creatorId: "b" }]);
    expect(await getFollowedCreatorIds("u1")).toEqual(["a", "b"]);
    expect(db.follow.findMany).toHaveBeenCalledWith({
      where: { followerId: "u1" },
      select: { creatorId: true },
    });
  });

  it("returns an empty array when the user follows nobody", async () => {
    db.follow.findMany.mockResolvedValue([]);
    expect(await getFollowedCreatorIds("u1")).toEqual([]);
  });
});

describe("isFollowing", () => {
  it("is true when the follow row exists", async () => {
    db.follow.findUnique.mockResolvedValue({ followerId: "u1", creatorId: "c1" });
    expect(await isFollowing("u1", "c1")).toBe(true);
  });

  it("is false when there is no follow row", async () => {
    db.follow.findUnique.mockResolvedValue(null);
    expect(await isFollowing("u1", "c1")).toBe(false);
  });
});

describe("getFollowState", () => {
  it("is following when a follow row exists", async () => {
    db.follow.findUnique.mockResolvedValue({ followerId: "u1" });
    db.followRequest.findUnique.mockResolvedValue(null);
    expect(await getFollowState("u1", "c1")).toBe("following");
  });

  it("is requested when only a pending request exists", async () => {
    db.follow.findUnique.mockResolvedValue(null);
    db.followRequest.findUnique.mockResolvedValue({ requesterId: "u1" });
    expect(await getFollowState("u1", "c1")).toBe("requested");
  });

  it("is none when there is neither a follow nor a request", async () => {
    db.follow.findUnique.mockResolvedValue(null);
    db.followRequest.findUnique.mockResolvedValue(null);
    expect(await getFollowState("u1", "c1")).toBe("none");
  });
});

describe("getPendingFollowRequests", () => {
  it("maps the requesters to creators, newest first", async () => {
    db.followRequest.findMany.mockResolvedValue([
      {
        requester: {
          id: "r1",
          name: "Req",
          username: "req",
          bio: null,
          avatarUrl: null,
          followersLabel: null,
          verified: false,
          isPrivate: false,
        },
      },
    ]);
    const result = await getPendingFollowRequests("u1");
    expect(result.map((creator) => creator.id)).toEqual(["r1"]);
    expect(db.followRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { targetId: "u1" } }),
    );
  });
});

describe("getPendingFollowRequestCount", () => {
  it("counts the requests targeting the user", async () => {
    db.followRequest.count.mockResolvedValue(3);
    expect(await getPendingFollowRequestCount("u1")).toBe(3);
    expect(db.followRequest.count).toHaveBeenCalledWith({ where: { targetId: "u1" } });
  });
});
