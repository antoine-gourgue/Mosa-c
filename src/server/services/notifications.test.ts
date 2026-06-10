import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns: string) => {
    const en = (await import("../../../messages/en.json")).default as unknown as Record<
      string,
      Record<string, string>
    >;
    return (key: string, values?: Record<string, string>) => {
      let msg = en[ns]?.[key] ?? key;
      for (const [k, v] of Object.entries(values ?? {})) {
        msg = msg.replace(`{${k}}`, v);
      }
      return msg;
    };
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getNotifications, getUnreadCount } from "./notifications";

const db = prisma as unknown as {
  notification: { findMany: Mock; count: Mock };
};

const actor = {
  id: "a1",
  name: "Mira",
  username: "mira",
  bio: null,
  avatarUrl: null,
  followersLabel: null,
  verified: false,
};

const row = (type: string, over: Record<string, unknown> = {}) => ({
  id: `n-${type}`,
  type,
  read: false,
  createdAt: new Date("2026-06-09T00:00:00Z"),
  actor,
  pinId: null,
  pin: null,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getNotifications", () => {
  it("builds the message for every kind from the actor name", async () => {
    db.notification.findMany.mockResolvedValue([
      row("FOLLOW"),
      row("LIKE"),
      row("COMMENT"),
      row("REPLY"),
      row("REACTION"),
      row("MENTION"),
    ]);
    const messages = (await getNotifications("u1")).map((n) => n.message);
    expect(messages).toEqual([
      "Mira started following you",
      "Mira liked your pin",
      "Mira commented on your pin",
      "Mira replied to your comment",
      "Mira reacted to your comment",
      "Mira mentioned you in a comment",
    ]);
  });

  it("maps the pin image and read state", async () => {
    db.notification.findMany.mockResolvedValue([
      row("LIKE", { read: true, pinId: "p1", pin: { imageUrl: "/p.png" } }),
    ]);
    const [notification] = await getNotifications("u1");
    expect(notification?.read).toBe(true);
    expect(notification?.pinId).toBe("p1");
    expect(notification?.pinImageUrl).toBe("/p.png");
    expect(notification?.kind).toBe("LIKE");
  });

  it("uses a null pin image when there is no pin", async () => {
    db.notification.findMany.mockResolvedValue([row("FOLLOW")]);
    const [notification] = await getNotifications("u1");
    expect(notification?.pinImageUrl).toBeNull();
  });
});

describe("getUnreadCount", () => {
  it("counts unread notifications for the recipient", async () => {
    db.notification.count.mockResolvedValue(4);
    expect(await getUnreadCount("u1")).toBe(4);
    expect(db.notification.count).toHaveBeenCalledWith({
      where: { recipientId: "u1", read: false },
    });
  });
});
