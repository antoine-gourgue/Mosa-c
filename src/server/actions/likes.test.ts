import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/server/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    like: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), count: vi.fn() },
    pin: { findUnique: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/notifications";
import { toggleLike } from "./likes";

const db = prisma as unknown as {
  like: { findUnique: Mock; create: Mock; delete: Mock; count: Mock };
  pin: { findUnique: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    name: "User",
    email: "u@x.com",
    image: null,
    role: "USER",
  } as never);
});

describe("toggleLike", () => {
  it("throws when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(toggleLike("p1")).rejects.toThrow(/signed in/);
  });

  it("creates a like and notifies the pin's creator", async () => {
    db.like.findUnique.mockResolvedValue(null);
    db.pin.findUnique.mockResolvedValue({ creatorId: "creator" });
    db.like.count.mockResolvedValue(3);
    const result = await toggleLike("p1");
    expect(db.like.create).toHaveBeenCalledWith({ data: { userId: "u1", pinId: "p1" } });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "LIKE", recipientId: "creator", actorId: "u1", pinId: "p1" }),
    );
    expect(result).toEqual({ liked: true, count: 3 });
  });

  it("does not notify when the pin no longer exists", async () => {
    db.like.findUnique.mockResolvedValue(null);
    db.pin.findUnique.mockResolvedValue(null);
    db.like.count.mockResolvedValue(1);
    await toggleLike("p1");
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("removes an existing like", async () => {
    db.like.findUnique.mockResolvedValue({ userId: "u1", pinId: "p1" });
    db.like.count.mockResolvedValue(0);
    const result = await toggleLike("p1");
    expect(db.like.delete).toHaveBeenCalled();
    expect(db.like.create).not.toHaveBeenCalled();
    expect(result).toEqual({ liked: false, count: 0 });
  });
});
