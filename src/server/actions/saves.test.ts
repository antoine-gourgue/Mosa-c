import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    save: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), upsert: vi.fn() },
    board: { findUnique: vi.fn() },
    boardMember: { findUnique: vi.fn() },
    boardPin: { upsert: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { savePinToBoard, toggleSave } from "./saves";

const db = prisma as unknown as {
  save: { findUnique: Mock; create: Mock; delete: Mock; upsert: Mock };
  board: { findUnique: Mock };
  boardMember: { findUnique: Mock };
  boardPin: { upsert: Mock };
};

describe("toggleSave", () => {
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

  it("creates a save when none exists", async () => {
    db.save.findUnique.mockResolvedValue(null);
    const result = await toggleSave("pin_1");
    expect(db.save.create).toHaveBeenCalledOnce();
    expect(db.save.delete).not.toHaveBeenCalled();
    expect(result).toEqual({ saved: true });
  });

  it("removes a save when it already exists", async () => {
    db.save.findUnique.mockResolvedValue({ userId: "u1", pinId: "pin_1" });
    const result = await toggleSave("pin_1");
    expect(db.save.delete).toHaveBeenCalledOnce();
    expect(db.save.create).not.toHaveBeenCalled();
    expect(result).toEqual({ saved: false });
  });

  it("throws when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(toggleSave("pin_1")).rejects.toThrow();
  });
});

describe("savePinToBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
  });

  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await savePinToBoard("p1", "b1")).ok).toBe(false);
  });

  it("rejects an unknown board", async () => {
    db.board.findUnique.mockResolvedValue(null);
    expect(await savePinToBoard("p1", "b1")).toMatchObject({
      ok: false,
      error: "Board not found.",
    });
  });

  it("rejects a non-member or viewer", async () => {
    db.board.findUnique.mockResolvedValue({ isDefault: false });
    db.boardMember.findUnique.mockResolvedValue(null);
    expect((await savePinToBoard("p1", "b1")).ok).toBe(false);
    db.boardMember.findUnique.mockResolvedValue({ role: "VIEWER" });
    expect((await savePinToBoard("p1", "b1")).ok).toBe(false);
  });

  it("upserts a Save for the default board", async () => {
    db.board.findUnique.mockResolvedValue({ isDefault: true });
    db.boardMember.findUnique.mockResolvedValue({ role: "OWNER" });
    expect(await savePinToBoard("p1", "b0")).toEqual({ ok: true });
    expect(db.save.upsert).toHaveBeenCalled();
    expect(db.boardPin.upsert).not.toHaveBeenCalled();
  });

  it("upserts a BoardPin for a non-default board", async () => {
    db.board.findUnique.mockResolvedValue({ isDefault: false });
    db.boardMember.findUnique.mockResolvedValue({ role: "EDITOR" });
    expect(await savePinToBoard("p1", "b1")).toEqual({ ok: true });
    expect(db.boardPin.upsert).toHaveBeenCalled();
  });
});
