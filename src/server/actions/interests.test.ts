import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tag: { findMany: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    userInterest: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveInterests } from "./interests";

const db = prisma as unknown as {
  tag: { findMany: Mock };
  user: { findUnique: Mock; update: Mock };
  userInterest: { deleteMany: Mock; createMany: Mock };
  $transaction: Mock;
};

beforeEach(() => {
  vi.clearAllMocks();
  db.user.findUnique.mockResolvedValue({ onboardedAt: null });
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    name: "User",
    email: "u@x.com",
    image: null,
    role: "USER",
  });
});

describe("saveInterests", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await saveInterests(["t1"])).toEqual({ ok: false });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("saves the selected valid tags and marks onboarding complete", async () => {
    db.tag.findMany.mockResolvedValue([{ id: "t1" }, { id: "t2" }]);
    expect(await saveInterests(["t1", "t2"])).toEqual({ ok: true });
    expect(db.userInterest.createMany).toHaveBeenCalledWith({
      data: [
        { userId: "u1", tagId: "t1" },
        { userId: "u1", tagId: "t2" },
      ],
      skipDuplicates: true,
    });
    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  it("drops unknown tag ids", async () => {
    db.tag.findMany.mockResolvedValue([{ id: "t1" }]);
    await saveInterests(["t1", "ghost"]);
    expect(db.userInterest.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: [{ userId: "u1", tagId: "t1" }] }),
    );
  });

  it("records a skip without creating interests", async () => {
    expect(await saveInterests([])).toEqual({ ok: true });
    expect(db.tag.findMany).not.toHaveBeenCalled();
    expect(db.userInterest.createMany).not.toHaveBeenCalled();
    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  it("preserves an existing onboarding time when editing later", async () => {
    const original = new Date("2026-01-01T00:00:00Z");
    db.user.findUnique.mockResolvedValue({ onboardedAt: original });
    db.tag.findMany.mockResolvedValue([{ id: "t1" }]);
    await saveInterests(["t1"]);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { onboardedAt: original },
    });
  });
});
