import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { pin: { create: vi.fn() }, save: { create: vi.fn() } },
}));
vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ put: vi.fn(async () => ({ url: "/uploads/x.png" })) }),
}));

import { getCurrentUser } from "@/lib/auth";
import { createPin } from "./pins";

describe("createPin", () => {
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

  it("requires an image", async () => {
    const formData = new FormData();
    formData.set("title", "Hello");
    const result = await createPin(formData);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("image") });
  });

  it("rejects when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const result = await createPin(new FormData());
    expect(result.ok).toBe(false);
  });
});
