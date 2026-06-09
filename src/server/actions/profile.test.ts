import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ put: vi.fn(async () => ({ url: "/uploads/avatar.png" })) }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { update: vi.fn() } } }));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateProfile } from "./profile";

const db = prisma as unknown as { user: { update: Mock } };

const form = (entries: Record<string, string | File>): FormData => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
  db.user.update.mockResolvedValue({ username: "ada" });
});

describe("updateProfile", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await updateProfile(form({ name: "Ada" }))).toEqual({
      ok: false,
      error: "You must be signed in.",
    });
  });

  it("rejects an empty name", async () => {
    const result = await updateProfile(form({ name: "  " }));
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/name is required/i) });
  });

  it("rejects a non-image avatar", async () => {
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    const result = await updateProfile(form({ name: "Ada", avatar: file }));
    expect(result).toEqual({ ok: false, error: "The avatar must be an image." });
  });

  it("updates name/bio and redirects to the profile", async () => {
    await updateProfile(form({ name: "Ada", bio: "builder" }));
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({ name: "Ada", bio: "builder" }),
      }),
    );
    expect(redirect).toHaveBeenCalledWith("/u/ada");
  });

  it("stores the avatar and redirects home when there is no username", async () => {
    db.user.update.mockResolvedValue({ username: null });
    const file = new File(["x"], "a.png", { type: "image/png" });
    await updateProfile(form({ name: "Ada", avatar: file }));
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          avatarUrl: "/uploads/avatar.png",
          image: "/uploads/avatar.png",
        }),
      }),
    );
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
