import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    board: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), create: vi.fn() },
    boardMember: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    boardPin: { upsert: vi.fn(), delete: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addBoardMember,
  addPinToBoard,
  createBoard,
  deleteBoard,
  leaveBoard,
  removeBoardMember,
  removePinFromBoard,
  updateBoard,
} from "./boards";

const db = prisma as unknown as {
  board: { findUnique: Mock; update: Mock; delete: Mock; create: Mock };
  boardMember: { findUnique: Mock; upsert: Mock; deleteMany: Mock };
  boardPin: { upsert: Mock; delete: Mock };
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

  describe("createBoard", () => {
    it("rejects when signed out", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      await expect(createBoard("Ideas")).rejects.toThrow();
    });

    it("rejects a blank name", async () => {
      await expect(createBoard("   ")).rejects.toThrow();
    });

    it("creates a board with an owner membership", async () => {
      db.board.create.mockResolvedValue({
        id: "b1",
        name: "Ideas",
        description: null,
        visibility: "PUBLIC",
        isDefault: false,
        _count: { pins: 0 },
      });
      expect(await createBoard("Ideas")).toEqual({
        id: "b1",
        name: "Ideas",
        description: null,
        visibility: "PUBLIC",
        isDefault: false,
        pinCount: 0,
      });
    });

    it("creates a secret board with a description", async () => {
      db.board.create.mockResolvedValue({
        id: "b2",
        name: "Gifts",
        description: "x",
        visibility: "SECRET",
        isDefault: false,
        _count: { pins: 0 },
      });
      await createBoard("Gifts", { secret: true, description: " Surprises " });
      expect(db.board.create.mock.calls[0]?.[0].data).toMatchObject({
        visibility: "SECRET",
        description: "Surprises",
      });
    });
  });

  describe("deleteBoard", () => {
    it("deletes a board owned by the user", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: false });
      await deleteBoard("b1");
      expect(db.board.delete).toHaveBeenCalledWith({ where: { id: "b1" } });
    });

    it("throws when the board does not exist", async () => {
      db.board.findUnique.mockResolvedValue(null);
      await expect(deleteBoard("missing")).rejects.toThrow();
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

  describe("updateBoard", () => {
    it("updates when the user is an editor", async () => {
      db.boardMember.findUnique.mockResolvedValue({ role: "EDITOR" });
      await updateBoard("b1", { name: "New name", secret: true });
      expect(db.board.update).toHaveBeenCalledWith({
        where: { id: "b1" },
        data: { name: "New name", description: null, visibility: "SECRET" },
      });
    });

    it("refuses when the user is only a viewer", async () => {
      db.boardMember.findUnique.mockResolvedValue({ role: "VIEWER" });
      await expect(updateBoard("b1", { name: "New name" })).rejects.toThrow();
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

    it("refuses to add the owner as a collaborator", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: false });
      db.user.findUnique.mockResolvedValue({ id: "u1" });
      await expect(addBoardMember("b1", "self", "EDITOR")).rejects.toThrow();
      expect(db.boardMember.upsert).not.toHaveBeenCalled();
    });

    it("rejects an invalid role", async () => {
      db.board.findUnique.mockResolvedValue({ ownerId: "u1", isDefault: false });
      await expect(
        addBoardMember("b1", "friend", "OWNER" as unknown as "EDITOR"),
      ).rejects.toThrow();
    });
  });

  describe("addPinToBoard / removePinFromBoard", () => {
    it("adds a pin when the user can edit", async () => {
      db.boardMember.findUnique.mockResolvedValue({ role: "EDITOR" });
      await addPinToBoard("p1", "b1");
      expect(db.boardPin.upsert).toHaveBeenCalled();
    });

    it("refuses to add a pin for a viewer", async () => {
      db.boardMember.findUnique.mockResolvedValue({ role: "VIEWER" });
      await expect(addPinToBoard("p1", "b1")).rejects.toThrow();
      expect(db.boardPin.upsert).not.toHaveBeenCalled();
    });

    it("removes a pin when the user can edit", async () => {
      db.boardMember.findUnique.mockResolvedValue({ role: "OWNER" });
      await removePinFromBoard("p1", "b1");
      expect(db.boardPin.delete).toHaveBeenCalledWith({
        where: { boardId_pinId: { boardId: "b1", pinId: "p1" } },
      });
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
