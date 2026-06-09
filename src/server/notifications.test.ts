import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { notification: { findFirst: vi.fn(), create: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { createNotification } from "./notifications";

const db = prisma as unknown as {
  notification: { findFirst: Mock; create: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
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
});
