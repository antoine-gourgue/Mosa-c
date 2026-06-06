import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { save: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() } },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleSave } from "./saves";

const db = prisma as unknown as {
  save: { findUnique: Mock; create: Mock; delete: Mock };
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
