import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversationParticipant: { updateMany: vi.fn() },
    message: { create: vi.fn() },
    conversation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    follow: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  acceptRequest,
  declineRequest,
  markConversationRead,
  sendMessage,
  startConversation,
} from "./messages";

const db = prisma as unknown as {
  conversationParticipant: { updateMany: Mock };
  message: { create: Mock };
  conversation: {
    findUnique: Mock;
    findFirst: Mock;
    create: Mock;
    update: Mock;
    updateMany: Mock;
    deleteMany: Mock;
  };
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
  it("persists a message for a participant of an accepted conversation", async () => {
    db.conversation.findFirst.mockResolvedValue({ status: "ACCEPTED", requestedById: null });
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
    db.conversation.findFirst.mockResolvedValue(null);
    const result = await sendMessage("c1", "hi");
    expect(result.ok).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("lets the requester send the first message of a pending request", async () => {
    db.conversation.findFirst.mockResolvedValue({ status: "PENDING", requestedById: "u1" });
    db.$transaction.mockResolvedValue([
      { id: "m1", conversationId: "c1", senderId: "u1", body: "hi", createdAt: new Date() },
      {},
    ]);
    const result = await sendMessage("c1", "hi");
    expect(result.ok).toBe(true);
  });

  it("blocks the recipient from replying to a pending request", async () => {
    db.conversation.findFirst.mockResolvedValue({ status: "PENDING", requestedById: "u2" });
    const result = await sendMessage("c1", "hi");
    expect(result.ok).toBe(false);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const result = await sendMessage("c1", "hi");
    expect(result.ok).toBe(false);
  });
});

describe("startConversation", () => {
  it("returns the existing conversation", async () => {
    db.conversation.findUnique.mockResolvedValue({ id: "c1" });
    const result = await startConversation("u2");
    expect(result).toEqual({ ok: true, conversationId: "c1" });
    expect(db.conversation.create).not.toHaveBeenCalled();
  });

  it("creates a pending request when the recipient does not follow back", async () => {
    db.conversation.findUnique.mockResolvedValue(null);
    db.follow.findUnique.mockResolvedValue(null);
    db.conversation.create.mockResolvedValue({ id: "c2" });
    const result = await startConversation("u2");
    expect(result).toEqual({ ok: true, conversationId: "c2" });
    expect(db.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PENDING", requestedById: "u1" }),
      }),
    );
  });

  it("creates an accepted conversation when the recipient follows the sender", async () => {
    db.conversation.findUnique.mockResolvedValue(null);
    db.follow.findUnique.mockResolvedValue({ followerId: "u2" });
    db.conversation.create.mockResolvedValue({ id: "c3" });
    const result = await startConversation("u2");
    expect(result).toEqual({ ok: true, conversationId: "c3" });
    expect(db.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACCEPTED", requestedById: null }),
      }),
    );
  });

  it("refuses to message yourself", async () => {
    const result = await startConversation("u1");
    expect(result.ok).toBe(false);
  });
});

describe("acceptRequest / declineRequest", () => {
  it("accepts a pending request for the recipient", async () => {
    db.conversation.updateMany.mockResolvedValue({ count: 1 });
    expect(await acceptRequest("c1")).toEqual({ ok: true });
  });

  it("rejects accepting when there is no matching request", async () => {
    db.conversation.updateMany.mockResolvedValue({ count: 0 });
    expect((await acceptRequest("c1")).ok).toBe(false);
  });

  it("declines a pending request for the recipient", async () => {
    db.conversation.deleteMany.mockResolvedValue({ count: 1 });
    expect(await declineRequest("c1")).toEqual({ ok: true });
  });

  it("rejects declining when there is no matching request", async () => {
    db.conversation.deleteMany.mockResolvedValue({ count: 0 });
    expect((await declineRequest("c1")).ok).toBe(false);
  });
});

describe("markConversationRead", () => {
  it("advances last-read for a participant", async () => {
    db.conversationParticipant.updateMany.mockResolvedValue({ count: 1 });
    expect(await markConversationRead("c1")).toEqual({ ok: true });
  });

  it("rejects when the conversation is not the user's", async () => {
    db.conversationParticipant.updateMany.mockResolvedValue({ count: 0 });
    expect((await markConversationRead("c1")).ok).toBe(false);
  });
});
