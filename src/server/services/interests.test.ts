import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userInterest: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getInterestTagIds, getInterestTags, hasOnboarded } from "./interests";

const db = prisma as unknown as {
  userInterest: { findMany: Mock };
  user: { findUnique: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getInterestTagIds", () => {
  it("returns the user's interest tag ids", async () => {
    db.userInterest.findMany.mockResolvedValue([{ tagId: "t1" }, { tagId: "t2" }]);
    expect(await getInterestTagIds("u1")).toEqual(["t1", "t2"]);
  });

  it("returns an empty array when there are none", async () => {
    db.userInterest.findMany.mockResolvedValue([]);
    expect(await getInterestTagIds("u1")).toEqual([]);
  });
});

describe("getInterestTags", () => {
  it("maps the user's interest tags with names", async () => {
    db.userInterest.findMany.mockResolvedValue([
      { tag: { id: "t1", slug: "bikes", name: "Bikes" } },
    ]);
    expect(await getInterestTags("u1")).toEqual([{ id: "t1", slug: "bikes", name: "Bikes" }]);
  });
});

describe("hasOnboarded", () => {
  it("is true when onboardedAt is set", async () => {
    db.user.findUnique.mockResolvedValue({ onboardedAt: new Date() });
    expect(await hasOnboarded("u1")).toBe(true);
  });

  it("is false when onboardedAt is null", async () => {
    db.user.findUnique.mockResolvedValue({ onboardedAt: null });
    expect(await hasOnboarded("u1")).toBe(false);
  });

  it("is false when the user is missing", async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect(await hasOnboarded("u1")).toBe(false);
  });
});
