import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comment: { findMany: vi.fn() },
    block: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { prisma } from "@/lib/prisma";
import { aggregateReactions, getComments, toComment } from "./comments";

const db = prisma as unknown as { comment: { findMany: Mock } };

const author = {
  id: "u1",
  name: "Ada",
  username: null,
  bio: null,
  avatarUrl: null,
  followersLabel: null,
  verified: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("aggregateReactions", () => {
  it("counts per emoji and flags the viewer's own reactions", () => {
    const rows = [
      { emoji: "❤️", userId: "u1" },
      { emoji: "❤️", userId: "u2" },
      { emoji: "😂", userId: "u3" },
    ];
    const result = aggregateReactions(rows, "u1");
    expect(result).toEqual([
      { emoji: "❤️", count: 2, reactedByViewer: true },
      { emoji: "😂", count: 1, reactedByViewer: false },
    ]);
  });

  it("sorts equal counts by emoji and never flags a signed-out viewer", () => {
    const result = aggregateReactions(
      [
        { emoji: "🔥", userId: "u1" },
        { emoji: "✨", userId: "u2" },
      ],
      null,
    );
    expect(result.map((r) => r.emoji)).toEqual(["✨", "🔥"]);
    expect(result.every((r) => !r.reactedByViewer)).toBe(true);
  });
});

describe("toComment", () => {
  it("maps a comment with empty replies and aggregated reactions", () => {
    const comment = toComment(
      {
        id: "c1",
        body: "nice",
        createdAt: new Date("2026-06-09T00:00:00Z"),
        author,
        reactions: [{ emoji: "❤️", userId: "u1" }],
      },
      "u1",
    );
    expect(comment.id).toBe("c1");
    expect(comment.replies).toEqual([]);
    expect(comment.reactions[0]).toMatchObject({ emoji: "❤️", reactedByViewer: true });
  });
});

describe("getComments", () => {
  it("maps root comments and nests one level of replies", async () => {
    db.comment.findMany.mockResolvedValue([
      {
        id: "c1",
        body: "root",
        createdAt: new Date("2026-06-09T00:00:00Z"),
        author,
        reactions: [],
        replies: [
          {
            id: "r1",
            body: "reply",
            createdAt: new Date("2026-06-09T00:01:00Z"),
            author,
            reactions: [],
          },
        ],
      },
    ]);
    const comments = await getComments("p1", "u1");
    expect(comments).toHaveLength(1);
    expect(comments[0]?.replies).toHaveLength(1);
    expect(comments[0]?.replies[0]?.body).toBe("reply");
  });
});
