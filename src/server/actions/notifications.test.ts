import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { notification: { updateMany: vi.fn() } },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markAllRead, markRead } from "./notifications";

const db = prisma as unknown as { notification: { updateMany: Mock } };

describe("notification actions", () => {
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

  it("marks a single notification read scoped to the recipient", async () => {
    await markRead("n1");
    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "n1", recipientId: "u1" },
      data: { read: true },
    });
  });

  it("marks all of the user's unread notifications read", async () => {
    await markAllRead();
    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: { recipientId: "u1", read: false },
      data: { read: true },
    });
  });

  it("throws when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(markRead("n1")).rejects.toThrow();
    expect(db.notification.updateMany).not.toHaveBeenCalled();
  });
});
