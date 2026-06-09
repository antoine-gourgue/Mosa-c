import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pin: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    save: { create: vi.fn(), upsert: vi.fn() },
    tag: { upsert: vi.fn() },
    pinTag: { create: vi.fn() },
    board: { findFirst: vi.fn(), create: vi.fn() },
    boardPin: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ put: vi.fn(async () => ({ url: "/uploads/x.png" })) }),
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createPin, deletePin } from "./pins";

const db = prisma as unknown as {
  pin: { create: Mock; findUnique: Mock; delete: Mock };
  save: { create: Mock; upsert: Mock };
  tag: { upsert: Mock };
  pinTag: { create: Mock };
  board: { findFirst: Mock; create: Mock };
  boardPin: { upsert: Mock };
};

const imageFile = () => new File(["x"], "a.png", { type: "image/png" });

const pinForm = (over: Record<string, string> = {}): FormData => {
  const fd = new FormData();
  fd.set("image", imageFile());
  fd.set("title", "Sunset");
  fd.set("width", "800");
  fd.set("height", "600");
  for (const [k, v] of Object.entries(over)) {
    fd.set(k, v);
  }
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
  db.pin.create.mockResolvedValue({ id: "p1" });
});

describe("createPin", () => {
  it("requires an image", async () => {
    const formData = new FormData();
    formData.set("title", "Hello");
    expect(await createPin(formData)).toEqual({
      ok: false,
      error: expect.stringContaining("image"),
    });
  });

  it("rejects a non-image file", async () => {
    const fd = new FormData();
    fd.set("image", new File(["x"], "a.txt", { type: "text/plain" }));
    expect((await createPin(fd)).ok).toBe(false);
  });

  it("rejects when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await createPin(new FormData())).ok).toBe(false);
  });

  it("rejects an invalid form (missing title)", async () => {
    const fd = pinForm();
    fd.delete("title");
    expect((await createPin(fd)).ok).toBe(false);
  });

  it("creates the pin with tags into an existing board and redirects", async () => {
    db.board.findFirst.mockResolvedValue({ id: "b1", isDefault: false });
    db.tag.upsert.mockResolvedValue({ id: "t1" });
    await createPin(pinForm({ tags: "Art, Art, Design", board: "Ideas" }));
    expect(db.pin.create).toHaveBeenCalled();
    expect(db.pinTag.create).toHaveBeenCalledTimes(2);
    expect(db.boardPin.upsert).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/boards/b1");
  });

  it("creates a default board and a Save when none matches", async () => {
    db.board.findFirst.mockResolvedValue(null);
    db.board.create.mockResolvedValue({ id: "b0", isDefault: true });
    await createPin(pinForm());
    expect(db.board.create).toHaveBeenCalled();
    expect(db.save.upsert).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/boards/b0");
  });
});

describe("deletePin", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await deletePin("p1")).ok).toBe(false);
  });

  it("returns not found for a missing pin", async () => {
    db.pin.findUnique.mockResolvedValue(null);
    expect(await deletePin("p1")).toMatchObject({ ok: false, error: "Pin not found." });
  });

  it("refuses to delete another user's pin", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "other" });
    expect((await deletePin("p1")).ok).toBe(false);
    expect(db.pin.delete).not.toHaveBeenCalled();
  });

  it("deletes the owner's pin", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "u1" });
    expect(await deletePin("p1")).toEqual({ ok: true });
    expect(db.pin.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });
});
