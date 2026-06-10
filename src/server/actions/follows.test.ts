import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    follow: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    notification: { findFirst: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleFollow } from "./follows";

const db = prisma as unknown as {
  follow: { findUnique: Mock; create: Mock; delete: Mock };
  notification: { findFirst: Mock; create: Mock };
  user: { findUnique: Mock };
};

describe("toggleFollow", () => {
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

  it("follows a creator when not already following", async () => {
    db.follow.findUnique.mockResolvedValue(null);
    db.notification.findFirst.mockResolvedValue(null);
    const result = await toggleFollow("creator1");
    expect(db.follow.create).toHaveBeenCalledOnce();
    expect(db.notification.create).toHaveBeenCalledOnce();
    expect(result).toEqual({ following: true });
  });

  it("unfollows when already following", async () => {
    db.follow.findUnique.mockResolvedValue({ followerId: "u1", creatorId: "creator1" });
    const result = await toggleFollow("creator1");
    expect(db.follow.delete).toHaveBeenCalledOnce();
    expect(result).toEqual({ following: false });
  });

  it("rejects following yourself", async () => {
    await expect(toggleFollow("u1")).rejects.toThrow();
    expect(db.follow.create).not.toHaveBeenCalled();
  });

  it("throws when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(toggleFollow("creator1")).rejects.toThrow();
  });
});
