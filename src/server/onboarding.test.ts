import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { board: { findFirst: vi.fn(), create: vi.fn() } },
}));
vi.mock("./username", () => ({ ensureUsername: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { ensureUserSetup } from "./onboarding";
import { ensureUsername } from "./username";

const db = prisma as unknown as {
  board: { findFirst: Mock; create: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ensureUserSetup", () => {
  it("ensures the username and creates a default board when missing", async () => {
    db.board.findFirst.mockResolvedValue(null);
    db.board.create.mockResolvedValue({ id: "b1" });
    await ensureUserSetup("u1");
    expect(ensureUsername).toHaveBeenCalledWith("u1");
    expect(db.board.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: "u1", isDefault: true, name: "Quick Saves" }),
      }),
    );
  });

  it("does not recreate the default board when one already exists", async () => {
    db.board.findFirst.mockResolvedValue({ id: "b1" });
    await ensureUserSetup("u1");
    expect(ensureUsername).toHaveBeenCalledWith("u1");
    expect(db.board.create).not.toHaveBeenCalled();
  });
});
