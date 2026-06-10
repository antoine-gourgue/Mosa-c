import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn() } } }));

import { prisma } from "@/lib/prisma";
import {
  defaultNotificationPrefs,
  getNotificationPrefs,
  parseNotificationPrefs,
  wantsNotification,
} from "./notification-prefs";

const db = prisma as unknown as { user: { findUnique: Mock } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("parseNotificationPrefs", () => {
  it("defaults every kind to enabled when unset", () => {
    expect(parseNotificationPrefs(null)).toEqual(defaultNotificationPrefs());
  });

  it("applies stored booleans and ignores unknown or malformed entries", () => {
    const prefs = parseNotificationPrefs({ LIKE: false, FOLLOW: "yes", BOGUS: true });
    expect(prefs.LIKE).toBe(false);
    expect(prefs.FOLLOW).toBe(true);
    expect(prefs.COMMENT).toBe(true);
  });
});

describe("getNotificationPrefs / wantsNotification", () => {
  it("reads and normalizes the stored preferences", async () => {
    db.user.findUnique.mockResolvedValue({ notifPrefs: { COMMENT: false } });
    const prefs = await getNotificationPrefs("u1");
    expect(prefs.COMMENT).toBe(false);
    expect(prefs.LIKE).toBe(true);
  });

  it("resolves whether a kind is wanted", async () => {
    db.user.findUnique.mockResolvedValue({ notifPrefs: { MENTION: false } });
    expect(await wantsNotification("u1", "MENTION")).toBe(false);
    db.user.findUnique.mockResolvedValue(null);
    expect(await wantsNotification("u1", "MENTION")).toBe(true);
  });
});
