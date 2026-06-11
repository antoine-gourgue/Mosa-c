import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    board: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    boardMember: { findMany: vi.fn(), findUnique: vi.fn() },
    boardPin: { findMany: vi.fn() },
    boardFollow: { findMany: vi.fn() },
    save: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  canEditBoard,
  canManageBoard,
  getBoardMembers,
  getBoardRole,
  getBoardsForUser,
  getBoardWithPins,
  getDefaultBoard,
  getFollowedBoardsWithCovers,
  getUserBoardsWithCovers,
} from "./boards";

const db = prisma as unknown as {
  board: { findMany: Mock; findUnique: Mock; findFirst: Mock };
  boardMember: { findMany: Mock; findUnique: Mock };
  boardPin: { findMany: Mock };
  boardFollow: { findMany: Mock };
  save: { findMany: Mock; count: Mock };
};

const creator = (id: string) => ({
  id,
  name: id,
  username: id,
  bio: null,
  avatarUrl: null,
  followersLabel: null,
  verified: false,
});

const pinRow = (id: string) => ({
  id,
  title: id,
  description: null,
  imageUrl: `/${id}.png`,
  width: 1,
  height: 1,
  link: null,
  downloadCount: 0,
  creator: creator("owner"),
  tags: [],
  _count: { likes: 0, comments: 0 },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getBoardsForUser", () => {
  it("maps boards with their pin counts", async () => {
    db.board.findMany.mockResolvedValue([
      { id: "b1", name: "Ideas", isDefault: false, _count: { pins: 4 } },
    ]);
    expect(await getBoardsForUser("u1")).toEqual([
      { id: "b1", name: "Ideas", isDefault: false, pinCount: 4 },
    ]);
  });
});

describe("getBoardMembers", () => {
  it("orders the owner first", async () => {
    db.boardMember.findMany.mockResolvedValue([
      { user: creator("editor"), role: "EDITOR" },
      { user: creator("owner"), role: "OWNER" },
    ]);
    const members = await getBoardMembers("b1");
    expect(members[0]?.role).toBe("OWNER");
  });
});

describe("getBoardRole / canEditBoard / canManageBoard", () => {
  it("returns the role or null", async () => {
    db.boardMember.findUnique.mockResolvedValue({ role: "EDITOR" });
    expect(await getBoardRole("b1", "u1")).toBe("EDITOR");
    db.boardMember.findUnique.mockResolvedValue(null);
    expect(await getBoardRole("b1", "u1")).toBeNull();
  });

  it("lets owners and editors edit, but only owners manage", async () => {
    db.boardMember.findUnique.mockResolvedValue({ role: "EDITOR" });
    expect(await canEditBoard("b1", "u1")).toBe(true);
    db.boardMember.findUnique.mockResolvedValue({ role: "VIEWER" });
    expect(await canEditBoard("b1", "u1")).toBe(false);

    db.board.findUnique.mockResolvedValue({ ownerId: "u1" });
    expect(await canManageBoard("b1", "u1")).toBe(true);
    db.board.findUnique.mockResolvedValue({ ownerId: "other" });
    expect(await canManageBoard("b1", "u1")).toBe(false);
    db.board.findUnique.mockResolvedValue(null);
    expect(await canManageBoard("b1", "u1")).toBe(false);
  });
});

describe("getDefaultBoard", () => {
  it("maps the default board or returns null", async () => {
    db.board.findFirst.mockResolvedValue({
      id: "b0",
      name: "Quick Saves",
      isDefault: true,
      _count: { pins: 2 },
    });
    expect(await getDefaultBoard("u1")).toMatchObject({ id: "b0", isDefault: true, pinCount: 2 });
    db.board.findFirst.mockResolvedValue(null);
    expect(await getDefaultBoard("u1")).toBeNull();
  });
});

describe("getBoardWithPins", () => {
  it("returns null when the board is missing", async () => {
    db.board.findUnique.mockResolvedValue(null);
    expect(await getBoardWithPins("b1")).toBeNull();
  });

  it("surfaces the owner's saved pins for the default board and resolves the viewer role", async () => {
    db.board.findUnique.mockResolvedValue({
      id: "b0",
      name: "Quick Saves",
      isDefault: true,
      ownerId: "owner",
      owner: creator("owner"),
    });
    db.boardMember.findMany.mockResolvedValue([{ user: creator("owner"), role: "OWNER" }]);
    db.save.findMany.mockResolvedValue([{ pin: pinRow("p1") }]);
    const detail = await getBoardWithPins("b0", "owner");
    expect(detail?.isDefault).toBe(true);
    expect(detail?.viewerRole).toBe("OWNER");
    expect(detail?.pins.map((p) => p.id)).toEqual(["p1"]);
  });

  it("surfaces board pins for a non-default board", async () => {
    db.board.findUnique.mockResolvedValue({
      id: "b1",
      name: "Ideas",
      isDefault: false,
      ownerId: "owner",
      owner: creator("owner"),
    });
    db.boardMember.findMany.mockResolvedValue([]);
    db.boardPin.findMany.mockResolvedValue([{ pin: pinRow("p2") }]);
    const detail = await getBoardWithPins("b1", null);
    expect(detail?.isDefault).toBe(false);
    expect(detail?.viewerRole).toBeNull();
    expect(detail?.pins.map((p) => p.id)).toEqual(["p2"]);
  });

  it("hides a secret board from a non-member viewer", async () => {
    db.board.findUnique.mockResolvedValue({
      id: "b1",
      name: "Secret",
      isDefault: false,
      visibility: "SECRET",
      ownerId: "owner",
      owner: creator("owner"),
    });
    db.boardMember.findMany.mockResolvedValue([{ user: creator("owner"), role: "OWNER" }]);
    expect(await getBoardWithPins("b1", "stranger")).toBeNull();
  });

  it("shows a secret board to its owner", async () => {
    db.board.findUnique.mockResolvedValue({
      id: "b1",
      name: "Secret",
      isDefault: false,
      visibility: "SECRET",
      ownerId: "owner",
      owner: creator("owner"),
    });
    db.boardMember.findMany.mockResolvedValue([{ user: creator("owner"), role: "OWNER" }]);
    db.boardPin.findMany.mockResolvedValue([{ pin: pinRow("p2") }]);
    expect(await getBoardWithPins("b1", "owner")).not.toBeNull();
  });
});

describe("getUserBoardsWithCovers", () => {
  it("builds covers and uses the saves count for the default board", async () => {
    db.board.findMany.mockResolvedValue([
      {
        id: "b0",
        name: "Quick Saves",
        isDefault: true,
        ownerId: "owner",
        _count: { pins: 0 },
        owner: { username: "ada" },
      },
      {
        id: "b1",
        name: "Ideas",
        isDefault: false,
        ownerId: "owner",
        _count: { pins: 5 },
        owner: { username: "ada" },
      },
    ]);
    db.save.findMany.mockResolvedValue([{ pin: { imageUrl: "/a.png" } }]);
    db.save.count.mockResolvedValue(7);
    db.boardPin.findMany.mockResolvedValue([{ pin: { imageUrl: "/b.png" } }]);
    const boards = await getUserBoardsWithCovers("owner");
    expect(boards[0]).toMatchObject({ pinCount: 7, coverUrls: ["/a.png"], ownerUsername: "ada" });
    expect(boards[1]).toMatchObject({ pinCount: 5, coverUrls: ["/b.png"] });
  });

  it("filters out secret boards for a different viewer", async () => {
    db.board.findMany.mockResolvedValue([]);
    await getUserBoardsWithCovers("owner", "stranger");
    const where = db.board.findMany.mock.calls[0]?.[0].where;
    expect(where.AND[1].OR).toEqual([
      { visibility: "PUBLIC" },
      { ownerId: "stranger" },
      { members: { some: { userId: "stranger" } } },
    ]);
  });
});

describe("getFollowedBoardsWithCovers", () => {
  it("maps followed public boards with covers and pin counts", async () => {
    db.boardFollow.findMany.mockResolvedValue([
      {
        board: {
          id: "b1",
          name: "Ideas",
          description: null,
          visibility: "PUBLIC",
          isDefault: false,
          ownerId: "owner",
          _count: { pins: 4 },
          owner: { username: "ada" },
        },
      },
    ]);
    db.boardPin.findMany.mockResolvedValue([{ pin: { imageUrl: "/p.png" } }]);
    const result = await getFollowedBoardsWithCovers("u1");
    expect(result).toEqual([
      {
        id: "b1",
        name: "Ideas",
        description: null,
        visibility: "PUBLIC",
        isDefault: false,
        pinCount: 4,
        coverUrls: ["/p.png"],
        ownerUsername: "ada",
      },
    ]);
    expect(db.boardFollow.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1", board: { visibility: "PUBLIC" } } }),
    );
  });

  it("returns an empty list when the user follows no boards", async () => {
    db.boardFollow.findMany.mockResolvedValue([]);
    expect(await getFollowedBoardsWithCovers("u1")).toEqual([]);
  });
});
