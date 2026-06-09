import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pin: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getSitemapEntries } from "./sitemap";

const db = prisma as unknown as {
  pin: { findMany: Mock };
  user: { findMany: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSitemapEntries", () => {
  it("returns pins and filters out profiles without a username", async () => {
    db.pin.findMany.mockResolvedValue([{ id: "p1", createdAt: new Date("2026-06-09T00:00:00Z") }]);
    db.user.findMany.mockResolvedValue([{ username: "ada" }, { username: null }]);
    const entries = await getSitemapEntries();
    expect(entries.pins).toHaveLength(1);
    expect(entries.profiles).toEqual([{ username: "ada" }]);
  });
});
