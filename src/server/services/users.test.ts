import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn(), findUnique: vi.fn() },
    follow: { count: vi.fn() },
    block: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getCreatorById,
  getFollowCounts,
  getSuggestedCreators,
  getUserByUsername,
  searchMentionUsers,
  searchUsers,
} from "./users";

const db = prisma as unknown as {
  user: { findMany: Mock; findUnique: Mock };
  follow: { count: Mock };
};

const userRow = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  name: id,
  username: id,
  bio: null,
  avatarUrl: null,
  followersLabel: null,
  verified: false,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchMentionUsers", () => {
  it("drops users without a username and maps the rest", async () => {
    db.user.findMany.mockResolvedValue([
      { id: "u1", name: "Ada", username: "ada", avatarUrl: null },
      { id: "u2", name: "NoHandle", username: null, avatarUrl: null },
    ]);
    const result = await searchMentionUsers("a", "me");
    expect(result).toEqual([{ id: "u1", name: "Ada", username: "ada", avatarUrl: null }]);
  });

  it("omits the id filter when no user is excluded and adds an OR for a query", async () => {
    db.user.findMany.mockResolvedValue([]);
    await searchMentionUsers("  art  ", null);
    const args = db.user.findMany.mock.calls[0]?.[0];
    expect(args.where.id).toBeUndefined();
    expect(args.where.OR).toHaveLength(2);
  });

  it("omits the OR clause for a blank query", async () => {
    db.user.findMany.mockResolvedValue([]);
    await searchMentionUsers("   ", "me");
    const args = db.user.findMany.mock.calls[0]?.[0];
    expect(args.where.OR).toBeUndefined();
    expect(args.where.id).toEqual({ not: "me" });
  });
});

describe("searchUsers", () => {
  it("returns an empty list for a blank query without querying", async () => {
    expect(await searchUsers("   ", "me")).toEqual([]);
    expect(db.user.findMany).not.toHaveBeenCalled();
  });

  it("filters to handled accounts, excludes the viewer, and maps creators", async () => {
    db.user.findMany.mockResolvedValue([userRow("ada", { verified: true }), userRow("ben")]);
    const result = await searchUsers("a", "me");
    expect(result.map((c) => c.id)).toEqual(["ada", "ben"]);
    const args = db.user.findMany.mock.calls[0]?.[0];
    expect(args.where.username).toEqual({ not: null });
    expect(args.where.OR).toHaveLength(2);
    expect(args.where.id).toEqual({ not: "me" });
  });

  it("omits the id filter when signed out", async () => {
    db.user.findMany.mockResolvedValue([]);
    await searchUsers("art", null);
    const args = db.user.findMany.mock.calls[0]?.[0];
    expect(args.where.id).toBeUndefined();
  });
});

describe("getCreatorById / getUserByUsername", () => {
  it("maps a found user and returns null otherwise", async () => {
    db.user.findUnique.mockResolvedValueOnce(userRow("u1"));
    expect((await getCreatorById("u1"))?.id).toBe("u1");
    db.user.findUnique.mockResolvedValueOnce(null);
    expect(await getCreatorById("missing")).toBeNull();

    db.user.findUnique.mockResolvedValueOnce(userRow("ada", { username: "ada" }));
    expect((await getUserByUsername("ada"))?.username).toBe("ada");
    db.user.findUnique.mockResolvedValueOnce(null);
    expect(await getUserByUsername("nope")).toBeNull();
  });
});

describe("getSuggestedCreators", () => {
  it("maps suggested creators", async () => {
    db.user.findMany.mockResolvedValue([userRow("u2"), userRow("u3")]);
    const creators = await getSuggestedCreators("u1");
    expect(creators.map((c) => c.id)).toEqual(["u2", "u3"]);
  });
});

describe("getFollowCounts", () => {
  it("returns followers and following counts", async () => {
    db.follow.count.mockResolvedValueOnce(10).mockResolvedValueOnce(4);
    expect(await getFollowCounts("u1")).toEqual({ followers: 10, following: 4 });
  });
});
