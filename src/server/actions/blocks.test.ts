import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/error-message", () => ({ errorMessage: async (key: string) => key }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    block: { upsert: vi.fn(), deleteMany: vi.fn() },
    follow: { deleteMany: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { blockUser, unblockUser } from "./blocks";

const db = prisma as unknown as {
  $transaction: Mock;
  block: { upsert: Mock; deleteMany: Mock };
  follow: { deleteMany: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
});

describe("blockUser", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await blockUser("u2")).ok).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("refuses to block yourself", async () => {
    expect((await blockUser("u1")).ok).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("blocks the user and removes any follow in both directions", async () => {
    expect(await blockUser("u2")).toEqual({ ok: true, blocked: true });
    expect(db.block.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { blockerId_blockedId: { blockerId: "u1", blockedId: "u2" } },
      }),
    );
    expect(db.follow.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { followerId: "u1", creatorId: "u2" },
          { followerId: "u2", creatorId: "u1" },
        ],
      },
    });
    expect(db.$transaction).toHaveBeenCalled();
  });
});

describe("unblockUser", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await unblockUser("u2")).ok).toBe(false);
    expect(db.block.deleteMany).not.toHaveBeenCalled();
  });

  it("removes the block", async () => {
    expect(await unblockUser("u2")).toEqual({ ok: true, blocked: false });
    expect(db.block.deleteMany).toHaveBeenCalledWith({
      where: { blockerId: "u1", blockedId: "u2" },
    });
  });
});
