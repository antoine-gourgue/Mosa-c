import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversationParticipant: { findUnique: vi.fn(), updateMany: vi.fn() },
    message: { create: vi.fn() },
    conversation: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    follow: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markConversationRead, sendMessage, startConversation } from "./messages";

const db = prisma as unknown as {
  conversationParticipant: { findUnique: Mock; updateMany: Mock };
  message: { create: Mock };
  conversation: { findUnique: Mock; create: Mock; update: Mock };
  follow: { findUnique: Mock };
  $transaction: Mock;
};

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

describe("sendMessage", () => {
  it("persists a message when the user is a participant", async () => {
    db.conversationParticipant.findUnique.mockResolvedValue({ userId: "u1" });
    db.$transaction.mockResolvedValue([
      {
        id: "m1",
        conversationId: "c1",
        senderId: "u1",
        body: "hi",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
      {},
    ]);
    const result = await sendMessage("c1", "hi");
    expect(result).toEqual({
      ok: true,
      message: {
        id: "m1",
        conversationId: "c1",
        senderId: "u1",
        body: "hi",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("rejects a non-participant", async () => {
    db.conversationParticipant.findUnique.mockResolvedValue(null);
    const result = await sendMessage("c1", "hi");
    expect(result.ok).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an empty body", async () => {
    db.conversationParticipant.findUnique.mockResolvedValue({ userId: "u1" });
    const result = await sendMessage("c1", "   ");
    expect(result.ok).toBe(false);
  });

  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const result = await sendMessage("c1", "hi");
    expect(result.ok).toBe(false);
  });
});

describe("startConversation", () => {
  it("returns the existing conversation without a mutual-follow check", async () => {
    db.conversation.findUnique.mockResolvedValue({ id: "c1" });
    const result = await startConversation("u2");
    expect(result).toEqual({ ok: true, conversationId: "c1" });
    expect(db.follow.findUnique).not.toHaveBeenCalled();
  });

  it("creates a conversation between mutual followers", async () => {
    db.conversation.findUnique.mockResolvedValue(null);
    db.follow.findUnique.mockResolvedValue({ followerId: "x" });
    db.conversation.create.mockResolvedValue({ id: "c2" });
    const result = await startConversation("u2");
    expect(result).toEqual({ ok: true, conversationId: "c2" });
  });

  it("refuses to start without a mutual follow", async () => {
    db.conversation.findUnique.mockResolvedValue(null);
    db.follow.findUnique.mockResolvedValue(null);
    const result = await startConversation("u2");
    expect(result.ok).toBe(false);
    expect(db.conversation.create).not.toHaveBeenCalled();
  });

  it("refuses to message yourself", async () => {
    const result = await startConversation("u1");
    expect(result.ok).toBe(false);
  });
});

describe("markConversationRead", () => {
  it("advances last-read for a participant", async () => {
    db.conversationParticipant.updateMany.mockResolvedValue({ count: 1 });
    const result = await markConversationRead("c1");
    expect(result).toEqual({ ok: true });
  });

  it("rejects when the conversation is not the user's", async () => {
    db.conversationParticipant.updateMany.mockResolvedValue({ count: 0 });
    const result = await markConversationRead("c1");
    expect(result.ok).toBe(false);
  });
});
