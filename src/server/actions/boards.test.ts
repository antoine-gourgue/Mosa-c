import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    board: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), create: vi.fn() },
    boardMember: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addBoardMember, deleteBoard, leaveBoard, removeBoardMember, renameBoard } from "./boards";

const db = prisma as unknown as {
  board: { findUnique: Mock; update: Mock; delete: Mock; create: Mock };
  boardMember: { findUnique: Mock; upsert: Mock; deleteMany: Mock };
  user: { findUnique: Mock };
};

describe("board actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      name: "User",
      email: "u@x.com",
      image: null,
      role: "USER",
    });
  });

  describe("deleteBoard", () => {
    it("deletes a board owned by the user", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: false });
      await deleteBoard("b1");
      expect(db.board.delete).toHaveBeenCalledWith({ where: { id: "b1" } });
    });

    it("refuses to delete the default board", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: true });
      await expect(deleteBoard("b1")).rejects.toThrow();
      expect(db.board.delete).not.toHaveBeenCalled();
    });

    it("refuses when the user is not the owner", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u2", isDefault: false });
      await expect(deleteBoard("b1")).rejects.toThrow();
      expect(db.board.delete).not.toHaveBeenCalled();
    });
  });

  describe("renameBoard", () => {
    it("renames when the user is an editor", async () => {
      db.boardMember.findUnique.mockResolvedValue({ role: "EDITOR" });
      await renameBoard("b1", "New name");
      expect(db.board.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: { name: "New name" },
      });
    });

    it("refuses when the user is only a viewer", async () => {
      db.boardMember.findUnique.mockResolvedValue({ role: "VIEWER" });
      await expect(renameBoard("b1", "New name")).rejects.toThrow();
      expect(db.board.update).not.toHaveBeenCalled();
    });
  });

  describe("addBoardMember", () => {
    it("adds a collaborator by username as the owner", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: false });
      db.user.findUnique.mockResolvedValue({ id: "u2" });
      await addBoardMember("b1", "@friend", "EDITOR");
      expect(db.boardMember.upsert).toHaveBeenCalledWith({
        where: { boardId_userId: { boardId: "b1", userId: "u2" } },
        update: { role: "EDITOR" },
        create: { boardId: "b1", userId: "u2", role: "EDITOR" },
      });
    });

    it("refuses when the actor is not the owner", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u9", isDefault: false });
      await expect(addBoardMember("b1", "friend", "EDITOR")).rejects.toThrow();
      expect(db.boardMember.upsert).not.toHaveBeenCalled();
    });

    it("rejects an unknown username", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: false });
      db.user.findUnique.mockResolvedValue(null);
      await expect(addBoardMember("b1", "ghost", "VIEWER")).rejects.toThrow();
      expect(db.boardMember.upsert).not.toHaveBeenCalled();
    });
  });

  describe("removeBoardMember", () => {
    it("refuses to remove the owner", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: false });
      await expect(removeBoardMember("b1", "u1")).rejects.toThrow();
      expect(db.boardMember.deleteMany).not.toHaveBeenCalled();
    });

    it("removes a collaborator as the owner", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: false });
      await removeBoardMember("b1", "u2");
      expect(db.boardMember.deleteMany).toHaveBeenCalledWith({
        where: { boardId: "b1", userId: "u2" },
      });
    });
  });

  describe("leaveBoard", () => {
    it("lets a collaborator leave", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u2", isDefault: false });
      await leaveBoard("b1");
      expect(db.boardMember.deleteMany).toHaveBeenCalledWith({
        where: { boardId: "b1", userId: "u1" },
      });
    });

    it("refuses to let the owner leave", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: false });
      await expect(leaveBoard("b1")).rejects.toThrow();
      expect(db.boardMember.deleteMany).not.toHaveBeenCalled();
    });
  });
});
