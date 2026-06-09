import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    follow: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getFollowedCreatorIds, isFollowing } from "./follows";

const db = prisma as unknown as {
  follow: { findMany: Mock; findUnique: Mock };
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
