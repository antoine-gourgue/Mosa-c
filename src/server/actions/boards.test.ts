import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    board: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), create: vi.fn() },
    boardMember: { findUnique: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteBoard, renameBoard } from "./boards";

const db = prisma as unknown as {
  board: { findUnique: Mock; update: Mock; delete: Mock; create: Mock };
  boardMember: { findUnique: Mock };
};

describe("board actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      name: "User",
      email: "u@x.com",
      image: null,
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
});
