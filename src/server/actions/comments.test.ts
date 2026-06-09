import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/server/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/server/services/users", () => ({ searchMentionUsers: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    comment: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    commentReaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/notifications";
import { searchMentionUsers } from "@/server/services/users";
import { addComment, addReply, deleteComment, searchMentions, toggleReaction } from "./comments";

const db = prisma as unknown as {
  user: { findMany: Mock };
  comment: { create: Mock; findUnique: Mock; delete: Mock };
  commentReaction: { findUnique: Mock; create: Mock; delete: Mock; findMany: Mock };
};

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
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
  db.user.findMany.mockResolvedValue([]);
});

describe("searchMentions", () => {
  it("returns an empty list when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await searchMentions("a")).toEqual([]);
  });

  it("delegates to the service when signed in", async () => {
    vi.mocked(searchMentionUsers).mockResolvedValue([{ id: "u2" }] as never);
    await searchMentions("ad");
    expect(searchMentionUsers).toHaveBeenCalledWith("ad", "u1");
  });
});

describe("addComment", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await addComment("p1", "hi")).toMatchObject({ ok: false });
  });

  it("rejects an empty body", async () => {
    expect(await addComment("p1", "   ")).toMatchObject({ ok: false });
  });

  it("creates a comment, notifies the owner and mentioned users", async () => {
    db.comment.create.mockResolvedValue({
      id: "c1",
      body: "hey @bob",
      createdAt: new Date("2026-06-09T00:00:00Z"),
      author,
      pin: { creatorId: "owner" },
    });
    db.user.findMany.mockResolvedValue([{ id: "bob" }]);
    const result = await addComment("p1", "hey @bob");
    expect(result).toMatchObject({ ok: true });
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: "COMMENT" }));
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: "MENTION" }));
  });
});

describe("addReply", () => {
  it("rejects when the target comment is on another pin", async () => {
    db.comment.findUnique.mockResolvedValue({
      id: "t",
      authorId: "x",
      parentId: null,
      pinId: "other",
    });
    expect(await addReply("p1", "t", "hi")).toMatchObject({
      ok: false,
      error: "Comment not found.",
    });
  });

  it("attaches a reply to the root comment and notifies the target author", async () => {
    db.comment.findUnique.mockResolvedValue({
      id: "t",
      authorId: "target",
      parentId: "root",
      pinId: "p1",
    });
    db.comment.create.mockResolvedValue({
      id: "r1",
      body: "ok",
      createdAt: new Date("2026-06-09T00:00:00Z"),
      author,
    });
    const result = await addReply("p1", "t", "ok");
    expect(result).toMatchObject({ ok: true });
    expect(db.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ parentId: "root" }) }),
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "REPLY", recipientId: "target" }),
    );
  });
});

describe("deleteComment", () => {
  it("rejects when the user is neither author nor pin owner", async () => {
    db.comment.findUnique.mockResolvedValue({
      authorId: "someone",
      pinId: "p1",
      pin: { creatorId: "owner" },
    });
    expect(await deleteComment("c1")).toMatchObject({ ok: false });
    expect(db.comment.delete).not.toHaveBeenCalled();
  });

  it("allows the pin owner to delete", async () => {
    db.comment.findUnique.mockResolvedValue({
      authorId: "someone",
      pinId: "p1",
      pin: { creatorId: "u1" },
    });
    expect(await deleteComment("c1")).toEqual({ ok: true });
    expect(db.comment.delete).toHaveBeenCalled();
  });

  it("returns not found for a missing comment", async () => {
    db.comment.findUnique.mockResolvedValue(null);
    expect(await deleteComment("c1")).toMatchObject({ ok: false });
  });
});

describe("toggleReaction", () => {
  beforeEach(() => {
    db.comment.findUnique.mockResolvedValue({ authorId: "author", pinId: "p1" });
    db.commentReaction.findMany.mockResolvedValue([{ emoji: "❤️", userId: "u1" }]);
  });

  it("adds a reaction and notifies the comment author", async () => {
    db.commentReaction.findUnique.mockResolvedValue(null);
    const result = await toggleReaction("c1", "❤️");
    expect(result).toMatchObject({ ok: true });
    expect(db.commentReaction.create).toHaveBeenCalled();
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({ type: "REACTION" }));
  });

  it("removes an existing reaction without notifying", async () => {
    db.commentReaction.findUnique.mockResolvedValue({ emoji: "❤️" });
    await toggleReaction("c1", "❤️");
    expect(db.commentReaction.delete).toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("rejects an invalid emoji", async () => {
    expect(await toggleReaction("c1", "")).toMatchObject({ ok: false });
  });
});
