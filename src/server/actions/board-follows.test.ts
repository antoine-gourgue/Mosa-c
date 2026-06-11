import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    board: { findUnique: vi.fn() },
    boardFollow: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleBoardFollow } from "./board-follows";

const db = prisma as unknown as {
  board: { findUnique: Mock };
  boardFollow: { findUnique: Mock; create: Mock; delete: Mock };
};

const PUBLIC_BOARD = { ownerId: "owner", visibility: "PUBLIC", isDefault: false };

beforeEach(() => {
  vi.clearAllMocks();
  db.board.findUnique.mockResolvedValue(PUBLIC_BOARD);
  db.boardFollow.findUnique.mockResolvedValue(null);
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    name: "User",
    email: "u@x.com",
    image: null,
    role: "USER",
  });
});

describe("toggleBoardFollow", () => {
  it("follows a public board when not already following", async () => {
    const result = await toggleBoardFollow("b1");
    expect(db.boardFollow.create).toHaveBeenCalledOnce();
    expect(result).toEqual({ following: true });
  });

  it("unfollows when already following", async () => {
    db.boardFollow.findUnique.mockResolvedValue({ userId: "u1", boardId: "b1" });
    const result = await toggleBoardFollow("b1");
    expect(db.boardFollow.delete).toHaveBeenCalledOnce();
    expect(result).toEqual({ following: false });
  });

  it("rejects following your own board", async () => {
    db.board.findUnique.mockResolvedValue({ ...PUBLIC_BOARD, ownerId: "u1" });
    await expect(toggleBoardFollow("b1")).rejects.toThrow();
    expect(db.boardFollow.create).not.toHaveBeenCalled();
  });

  it("rejects a secret board", async () => {
    db.board.findUnique.mockResolvedValue({ ...PUBLIC_BOARD, visibility: "SECRET" });
    await expect(toggleBoardFollow("b1")).rejects.toThrow();
    expect(db.boardFollow.create).not.toHaveBeenCalled();
  });

  it("rejects the default board", async () => {
    db.board.findUnique.mockResolvedValue({ ...PUBLIC_BOARD, isDefault: true });
    await expect(toggleBoardFollow("b1")).rejects.toThrow();
    expect(db.boardFollow.create).not.toHaveBeenCalled();
  });

  it("rejects a board that no longer exists", async () => {
    db.board.findUnique.mockResolvedValue(null);
    await expect(toggleBoardFollow("b1")).rejects.toThrow();
  });

  it("throws when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(toggleBoardFollow("b1")).rejects.toThrow();
    expect(db.board.findUnique).not.toHaveBeenCalled();
  });
});
