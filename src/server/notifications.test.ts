import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { findFirst: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));
vi.mock("@/server/realtime-emit", () => ({ emitToUser: vi.fn() }));
vi.mock("@/server/push", () => ({ sendPushToUser: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/server/push";
import { createNotification } from "./notifications";

const db = prisma as unknown as {
  notification: { findFirst: Mock; create: Mock };
  user: { findUnique: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
  db.user.findUnique.mockResolvedValue(null);
  db.notification.create.mockResolvedValue({ id: "n1" });
});

describe("createNotification", () => {
  it("skips self-directed notifications", async () => {
    await createNotification({ type: "LIKE", recipientId: "u1", actorId: "u1" });
    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it("collapses a duplicate unread FOLLOW/LIKE from the same actor", async () => {
    db.notification.findFirst.mockResolvedValue({ id: "existing" });
    await createNotification({ type: "FOLLOW", recipientId: "u1", actorId: "u2" });
    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it("creates a LIKE notification when there is no unread duplicate", async () => {
    db.notification.findFirst.mockResolvedValue(null);
    await createNotification({ type: "LIKE", recipientId: "u1", actorId: "u2", pinId: "p1" });
    expect(db.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: "LIKE", pinId: "p1" }) }),
    );
  });

  it("skips a kind the recipient has turned off", async () => {
    db.user.findUnique.mockResolvedValue({ notifPrefs: { LIKE: false } });
    await createNotification({ type: "LIKE", recipientId: "u1", actorId: "u2", pinId: "p1" });
    expect(db.notification.create).not.toHaveBeenCalled();
  });

  it("always creates a COMMENT notification without deduping", async () => {
    await createNotification({
      type: "COMMENT",
      recipientId: "u1",
      actorId: "u2",
      pinId: "p1",
      commentId: "c1",
    });
    expect(db.notification.findFirst).not.toHaveBeenCalled();
    expect(db.notification.create).toHaveBeenCalled();
  });

  it("sends a push to the recipient with the actor's name and a link", async () => {
    db.notification.findFirst.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue({ name: "Ada" });
    await createNotification({ type: "LIKE", recipientId: "u1", actorId: "u2", pinId: "p1" });
    expect(sendPushToUser).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ body: "Ada liked your pin", url: "/pin/p1" }),
    );
  });
});
