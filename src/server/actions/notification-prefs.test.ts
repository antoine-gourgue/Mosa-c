import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/error-message", () => ({ errorMessage: async (key: string) => key }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationPrefs } from "@/server/services/notification-prefs";
import { updateNotificationPref, updateNotificationPrefs } from "./notification-prefs";

const db = prisma as unknown as { user: { findUnique: Mock; update: Mock } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
  db.user.findUnique.mockResolvedValue(null);
});

describe("updateNotificationPref", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await updateNotificationPref("LIKE", false)).ok).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("merges the toggled kind into the stored preferences", async () => {
    expect(await updateNotificationPref("LIKE", false)).toEqual({ ok: true });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        notifPrefs: expect.objectContaining({ LIKE: false, FOLLOW: true, COMMENT: true }),
      },
    });
  });
});

describe("updateNotificationPrefs", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await updateNotificationPrefs({} as NotificationPrefs)).ok).toBe(false);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("stores the full sanitised preference map", async () => {
    const prefs = {
      FOLLOW: false,
      LIKE: true,
      COMMENT: false,
      REPLY: true,
      REACTION: true,
      MENTION: false,
    } satisfies NotificationPrefs;
    expect(await updateNotificationPrefs(prefs)).toEqual({ ok: true });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { notifPrefs: prefs },
    });
  });
});
