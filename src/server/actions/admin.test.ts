import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() } },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUser, setUserDisabled, setUserRole } from "./admin";

const db = prisma as unknown as {
  user: { findUnique: Mock; update: Mock; delete: Mock };
};

/**
 * Signs the mocked caller in as an admin.
 *
 * @param id - The admin user id.
 */
function asAdmin(id = "admin1"): void {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id,
    name: "Admin",
    email: "a@x.com",
    image: null,
    role: "ADMIN",
  });
  db.user.findUnique.mockResolvedValue({ role: "ADMIN" });
}

describe("admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-admin callers", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      name: "U",
      email: "u@x.com",
      image: null,
      role: "USER",
    });
    db.user.findUnique.mockResolvedValue({ role: "USER" });
    await expect(setUserRole("u2", "ADMIN")).rejects.toThrow();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(setUserRole("u2", "ADMIN")).rejects.toThrow();
  });

  it("prevents an admin from changing their own role", async () => {
    asAdmin("admin1");
    await expect(setUserRole("admin1", "USER")).rejects.toThrow();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("promotes another user", async () => {
    asAdmin();
    await setUserRole("u2", "ADMIN");
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { role: "ADMIN" },
    });
  });

  it("prevents self ban and self delete", async () => {
    asAdmin("admin1");
    await expect(setUserDisabled("admin1", true)).rejects.toThrow();
    await expect(deleteUser("admin1")).rejects.toThrow();
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.user.delete).not.toHaveBeenCalled();
  });

  it("deletes another user", async () => {
    asAdmin();
    await deleteUser("u2");
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: "u2" } });
  });
});
