import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { ensureUsername } from "./username";

const db = prisma as unknown as {
  user: { findUnique: Mock; update: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ensureUsername", () => {
  it("does nothing when the user already has a username", async () => {
    db.user.findUnique.mockResolvedValue({ username: "ada", email: null, name: null });
    await ensureUsername("u1");
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("does nothing when the user does not exist", async () => {
    db.user.findUnique.mockResolvedValue(null);
    await ensureUsername("u1");
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("derives a handle from the email and assigns it when free", async () => {
    db.user.findUnique
      .mockResolvedValueOnce({ username: null, email: "Ada.Lovelace@x.com", name: "Ada" })
      .mockResolvedValueOnce(null);
    db.user.update.mockResolvedValue({});
    await ensureUsername("u1");
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { username: "adalovelace" },
    });
  });

  it("appends a numeric suffix when the base handle is taken", async () => {
    db.user.findUnique
      .mockResolvedValueOnce({ username: null, email: null, name: "Ada" })
      .mockResolvedValueOnce({ id: "other" })
      .mockResolvedValueOnce(null);
    db.user.update.mockResolvedValue({});
    await ensureUsername("u1");
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { username: "ada1" },
    });
  });

  it("falls back to a timestamped handle when the update races", async () => {
    db.user.findUnique
      .mockResolvedValueOnce({ username: null, email: null, name: "Ada" })
      .mockResolvedValueOnce(null);
    db.user.update.mockRejectedValueOnce(new Error("unique")).mockResolvedValueOnce({});
    await ensureUsername("u1");
    expect(db.user.update).toHaveBeenCalledTimes(2);
    expect(db.user.update.mock.calls[1]?.[0].data.username).toMatch(/^ada\d+$/);
  });

  it("uses a default base when there is no email or name", async () => {
    db.user.findUnique
      .mockResolvedValueOnce({ username: null, email: null, name: null })
      .mockResolvedValueOnce(null);
    db.user.update.mockResolvedValue({});
    await ensureUsername("u1");
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { username: "user" },
    });
  });
});
