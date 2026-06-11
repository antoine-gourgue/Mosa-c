import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    boardFollow: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getFollowedBoardIds, isFollowingBoard } from "./board-follows";

const db = prisma as unknown as {
  boardFollow: { findMany: Mock; findUnique: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getFollowedBoardIds", () => {
  it("returns the followed board ids", async () => {
    db.boardFollow.findMany.mockResolvedValue([{ boardId: "b1" }, { boardId: "b2" }]);
    expect(await getFollowedBoardIds("u1")).toEqual(["b1", "b2"]);
    expect(db.boardFollow.findMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      select: { boardId: true },
    });
  });

  it("returns an empty array when the user follows no boards", async () => {
    db.boardFollow.findMany.mockResolvedValue([]);
    expect(await getFollowedBoardIds("u1")).toEqual([]);
  });
});

describe("isFollowingBoard", () => {
  it("is true when the board-follow row exists", async () => {
    db.boardFollow.findUnique.mockResolvedValue({ userId: "u1", boardId: "b1" });
    expect(await isFollowingBoard("u1", "b1")).toBe(true);
  });

  it("is false when there is no row", async () => {
    db.boardFollow.findUnique.mockResolvedValue(null);
    expect(await isFollowingBoard("u1", "b1")).toBe(false);
  });
});
