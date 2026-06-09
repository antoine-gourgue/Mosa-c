import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ put: vi.fn(async () => ({ url: "/uploads/avatar.png" })) }),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { update: vi.fn(), findFirst: vi.fn() } },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateProfile } from "./profile";

const db = prisma as unknown as {
  user: { update: Mock; findFirst: Mock };
};

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
  db.user.update.mockResolvedValue({});
  db.user.findFirst.mockResolvedValue(null);
});

describe("updateProfile", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await updateProfile(form({ username: "ada", name: "Ada" }))).toEqual({
      ok: false,
      error: "You must be signed in.",
    });
  });

  it("rejects an empty name", async () => {
    const result = await updateProfile(form({ username: "ada", name: "  " }));
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/name is required/i) });
  });

  it("rejects an invalid username", async () => {
    expect((await updateProfile(form({ username: "ab", name: "Ada" }))).ok).toBe(false);
  });

  it("rejects a username taken by someone else", async () => {
    db.user.findFirst.mockResolvedValue({ id: "other" });
    expect(await updateProfile(form({ username: "ada", name: "Ada" }))).toEqual({
      ok: false,
      error: "That username is already taken.",
    });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("rejects a non-image avatar", async () => {
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    const result = await updateProfile(form({ username: "ada", name: "Ada", avatar: file }));
    expect(result).toEqual({ ok: false, error: "The avatar must be an image." });
  });

  it("updates the profile and redirects to the (lowercased) handle", async () => {
    await updateProfile(form({ username: "Ada", name: "Ada", bio: "builder", gender: "FEMALE" }));
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          username: "ada",
          name: "Ada",
          bio: "builder",
          gender: "FEMALE",
        }),
      }),
    );
    expect(redirect).toHaveBeenCalledWith("/u/ada");
  });

  it("stores a new avatar", async () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    await updateProfile(form({ username: "ada", name: "Ada", avatar: file }));
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          avatarUrl: "/uploads/avatar.png",
          image: "/uploads/avatar.png",
        }),
      }),
    );
  });

  it("clears the avatar when removeAvatar is set", async () => {
    await updateProfile(form({ username: "ada", name: "Ada", removeAvatar: "true" }));
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ avatarUrl: null, image: null }),
      }),
    );
  });
});
