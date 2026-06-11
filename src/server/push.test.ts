import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("web-push", () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}));
vi.mock("@/lib/env", () => ({
  env: { VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv", VAPID_SUBJECT: "mailto:x" },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { pushSubscription: { findMany: vi.fn(), delete: vi.fn() } },
}));

import webpush from "web-push";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { pushConfigured, sendPushToUser } from "./push";

const wp = webpush as unknown as { sendNotification: Mock };
const db = prisma as unknown as {
  pushSubscription: { findMany: Mock; delete: Mock };
};
const mutableEnv = env as { VAPID_PUBLIC_KEY?: string; VAPID_PRIVATE_KEY?: string };

const sub = (endpoint: string) => ({ endpoint, p256dh: "p", auth: "a" });

beforeEach(() => {
  vi.clearAllMocks();
  mutableEnv.VAPID_PUBLIC_KEY = "pub";
  mutableEnv.VAPID_PRIVATE_KEY = "priv";
  db.pushSubscription.delete.mockResolvedValue(undefined);
});

describe("pushConfigured", () => {
  it("is true when both VAPID keys are set", () => {
    expect(pushConfigured()).toBe(true);
  });

  it("is false when a key is missing", () => {
    mutableEnv.VAPID_PRIVATE_KEY = undefined;
    expect(pushConfigured()).toBe(false);
  });
});

describe("sendPushToUser", () => {
  it("no-ops when Web Push is not configured", async () => {
    mutableEnv.VAPID_PUBLIC_KEY = undefined;
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(db.pushSubscription.findMany).not.toHaveBeenCalled();
  });

  it("no-ops when the user has no subscriptions", async () => {
    db.pushSubscription.findMany.mockResolvedValue([]);
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(wp.sendNotification).not.toHaveBeenCalled();
  });

  it("sends to every subscription of the user", async () => {
    db.pushSubscription.findMany.mockResolvedValue([sub("e1"), sub("e2")]);
    wp.sendNotification.mockResolvedValue(undefined);
    await sendPushToUser("u1", { title: "t", body: "b", url: "/x" });
    expect(wp.sendNotification).toHaveBeenCalledTimes(2);
    expect(db.pushSubscription.delete).not.toHaveBeenCalled();
  });

  it("deletes a subscription the push service reports as gone (410)", async () => {
    db.pushSubscription.findMany.mockResolvedValue([sub("dead")]);
    wp.sendNotification.mockRejectedValue({ statusCode: 410 });
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(db.pushSubscription.delete).toHaveBeenCalledWith({ where: { endpoint: "dead" } });
  });

  it("keeps a subscription on a transient failure", async () => {
    db.pushSubscription.findMany.mockResolvedValue([sub("e1")]);
    wp.sendNotification.mockRejectedValue({ statusCode: 500 });
    await sendPushToUser("u1", { title: "t", body: "b" });
    expect(db.pushSubscription.delete).not.toHaveBeenCalled();
  });
});
