import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/server/push", () => ({ sendPushToUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { pushSubscription: { upsert: vi.fn(), deleteMany: vi.fn() } },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/server/push";
import { deletePushSubscription, savePushSubscription, sendTestPush } from "./push";

const db = prisma as unknown as {
  pushSubscription: { upsert: Mock; deleteMany: Mock };
};

const SUB = { endpoint: "https://push/e1", keys: { p256dh: "p", auth: "a" } };

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

describe("savePushSubscription", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await savePushSubscription(SUB)).toEqual({ ok: false });
    expect(db.pushSubscription.upsert).not.toHaveBeenCalled();
  });

  it("rejects a malformed subscription", async () => {
    expect(await savePushSubscription({ endpoint: "", keys: { p256dh: "p", auth: "a" } })).toEqual({
      ok: false,
    });
  });

  it("upserts the subscription by endpoint", async () => {
    expect(await savePushSubscription(SUB)).toEqual({ ok: true });
    expect(db.pushSubscription.upsert).toHaveBeenCalledWith({
      where: { endpoint: SUB.endpoint },
      update: { userId: "u1", p256dh: "p", auth: "a" },
      create: { userId: "u1", endpoint: SUB.endpoint, p256dh: "p", auth: "a" },
    });
  });
});

describe("deletePushSubscription", () => {
  it("removes the endpoint scoped to the user", async () => {
    expect(await deletePushSubscription("https://push/e1")).toEqual({ ok: true });
    expect(db.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: "https://push/e1", userId: "u1" },
    });
  });

  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await deletePushSubscription("e")).toEqual({ ok: false });
  });
});

describe("sendTestPush", () => {
  it("dispatches a test push to the current user", async () => {
    expect(await sendTestPush()).toEqual({ ok: true });
    expect(sendPushToUser).toHaveBeenCalledWith("u1", expect.objectContaining({ tag: "test" }));
  });

  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await sendTestPush()).toEqual({ ok: false });
    expect(sendPushToUser).not.toHaveBeenCalled();
  });
});
