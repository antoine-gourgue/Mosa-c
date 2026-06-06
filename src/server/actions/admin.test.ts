import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    pin: { delete: vi.fn(), update: vi.fn() },
    comment: { delete: vi.fn() },
    report: { findUnique: vi.fn(), update: vi.fn() },
    category: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  adminDeleteComment,
  adminDeletePin,
  adminUpdatePin,
  adminUpdateUser,
  createCategory,
  deleteCategory,
  deleteUser,
  dismissReport,
  resolveReport,
  setUserDisabled,
  setUserRole,
} from "./admin";

const db = prisma as unknown as {
  user: { findUnique: Mock; update: Mock; delete: Mock };
  pin: { delete: Mock; update: Mock };
  comment: { delete: Mock };
  report: { findUnique: Mock; update: Mock };
  category: { findUnique: Mock; create: Mock; update: Mock; delete: Mock };
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

  it("updates a user's name and bio", async () => {
    asAdmin();
    await adminUpdateUser("u2", "New Name", "Hello there");
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { name: "New Name", bio: "Hello there" },
    });
  });

  it("clears the bio when blank", async () => {
    asAdmin();
    await adminUpdateUser("u2", "New Name", "");
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { name: "New Name", bio: null },
    });
  });

  it("lets an admin remove any pin", async () => {
    asAdmin();
    await adminDeletePin("pin1");
    expect(db.pin.delete).toHaveBeenCalledWith({ where: { id: "pin1" } });
  });

  it("lets an admin remove any comment", async () => {
    asAdmin();
    await adminDeleteComment("c1");
    expect(db.comment.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  it("updates a pin and connects a category", async () => {
    asAdmin();
    await adminUpdatePin("pin1", { title: "New", description: "", link: "", categoryId: "cat1" });
    expect(db.pin.update).toHaveBeenCalledWith({
      where: { id: "pin1" },
      data: { title: "New", description: null, link: null, category: { connect: { id: "cat1" } } },
    });
  });

  it("disconnects the category when none is given", async () => {
    asAdmin();
    await adminUpdatePin("pin1", {
      title: "New",
      description: "Desc",
      link: "https://x.example",
      categoryId: null,
    });
    expect(db.pin.update).toHaveBeenCalledWith({
      where: { id: "pin1" },
      data: {
        title: "New",
        description: "Desc",
        link: "https://x.example",
        category: { disconnect: true },
      },
    });
  });

  it("rejects moderation from non-admins", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      name: "U",
      email: "u@x.com",
      image: null,
      role: "USER",
    });
    db.user.findUnique.mockResolvedValue({ role: "USER" });
    await expect(adminDeletePin("pin1")).rejects.toThrow();
    await expect(adminDeleteComment("c1")).rejects.toThrow();
    expect(db.pin.delete).not.toHaveBeenCalled();
    expect(db.comment.delete).not.toHaveBeenCalled();
  });

  it("resolves a report by removing the reported pin", async () => {
    asAdmin();
    db.report.findUnique.mockResolvedValue({ pinId: "pin9" });
    await resolveReport("r1");
    expect(db.pin.delete).toHaveBeenCalledWith({ where: { id: "pin9" } });
  });

  it("dismisses a report without removing the pin", async () => {
    asAdmin();
    await dismissReport("r1");
    expect(db.report.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { status: "DISMISSED" },
    });
    expect(db.pin.delete).not.toHaveBeenCalled();
  });

  it("creates a category with a derived slug", async () => {
    asAdmin();
    db.category.findUnique.mockResolvedValue(null);
    await createCategory("Street Food", "https://img.example/x.jpg");
    expect(db.category.create).toHaveBeenCalledWith({
      data: { label: "Street Food", imageUrl: "https://img.example/x.jpg", slug: "street-food" },
    });
  });

  it("rejects a category whose slug already exists", async () => {
    asAdmin();
    db.category.findUnique.mockResolvedValue({ id: "other" });
    await expect(createCategory("Travel", "https://img.example/x.jpg")).rejects.toThrow();
    expect(db.category.create).not.toHaveBeenCalled();
  });

  it("rejects a category with an invalid image URL", async () => {
    asAdmin();
    await expect(createCategory("Travel", "not-a-url")).rejects.toThrow();
    expect(db.category.create).not.toHaveBeenCalled();
  });

  it("deletes a category", async () => {
    asAdmin();
    await deleteCategory("cat1");
    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: "cat1" } });
  });
});
