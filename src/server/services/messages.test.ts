import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    follow: { findUnique: vi.fn() },
    conversation: { findUnique: vi.fn(), create: vi.fn() },
    conversationParticipant: { findUnique: vi.fn(), findMany: vi.fn() },
    user: { findMany: vi.fn() },
    message: { count: vi.fn(), findMany: vi.fn() },
    block: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  areMutualFollowers,
  createGroupConversation,
  getConversations,
  getMessageRequests,
  getMessages,
  getOrCreateConversation,
  getUnreadConversationIds,
  isParticipant,
  pairKeyFor,
  toMessage,
} from "./messages";

const db = prisma as unknown as {
  follow: { findUnique: Mock };
  conversation: { findUnique: Mock; create: Mock };
  conversationParticipant: { findUnique: Mock; findMany: Mock };
  user: { findMany: Mock };
  message: { count: Mock; findMany: Mock };
};

const creatorRow = (id: string, name: string) => ({
  id,
  name,
  username: null,
  bio: null,
  avatarUrl: null,
  followersLabel: null,
  verified: false,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("pairKeyFor", () => {
  it("is independent of argument order", () => {
    expect(pairKeyFor("b", "a")).toBe("a:b");
    expect(pairKeyFor("a", "b")).toBe("a:b");
  });
});

describe("toMessage", () => {
  it("maps a row, including the system flag and attachments", () => {
    const mapped = toMessage({
      id: "m1",
      conversationId: "c1",
      senderId: "u1",
      body: "hi",
      createdAt: new Date("2026-06-09T00:00:00Z"),
      pin: { id: "p1", imageUrl: "/p.png", title: "Pin" },
      imageUrl: "/img.gif",
      system: true,
    });
    expect(mapped).toEqual({
      id: "m1",
      conversationId: "c1",
      senderId: "u1",
      body: "hi",
      createdAt: "2026-06-09T00:00:00.000Z",
      pin: { id: "p1", imageUrl: "/p.png", title: "Pin" },
      imageUrl: "/img.gif",
      system: true,
    });
  });
});

describe("areMutualFollowers", () => {
  it("is true only when both follow rows exist", async () => {
    db.follow.findUnique.mockResolvedValueOnce({ followerId: "a" }).mockResolvedValueOnce({
      followerId: "b",
    });
    expect(await areMutualFollowers("a", "b")).toBe(true);
  });

  it("is false when one direction is missing", async () => {
    db.follow.findUnique.mockResolvedValueOnce({ followerId: "a" }).mockResolvedValueOnce(null);
    expect(await areMutualFollowers("a", "b")).toBe(false);
  });
});

describe("isParticipant", () => {
  it("reflects whether the participant row exists", async () => {
    db.conversationParticipant.findUnique.mockResolvedValue({ userId: "u1" });
    expect(await isParticipant("c1", "u1")).toBe(true);
    db.conversationParticipant.findUnique.mockResolvedValue(null);
    expect(await isParticipant("c1", "u1")).toBe(false);
  });
});

describe("getOrCreateConversation", () => {
  it("returns null when messaging yourself", async () => {
    expect(await getOrCreateConversation("u1", "u1")).toBeNull();
    expect(db.conversation.findUnique).not.toHaveBeenCalled();
  });

  it("returns the existing conversation for the pair", async () => {
    db.conversation.findUnique.mockResolvedValue({ id: "existing" });
    expect(await getOrCreateConversation("u1", "u2")).toBe("existing");
    expect(db.conversation.create).not.toHaveBeenCalled();
  });

  it("creates an ACCEPTED conversation when the recipient already follows the sender", async () => {
    db.conversation.findUnique.mockResolvedValue(null);
    db.follow.findUnique.mockResolvedValue({ followerId: "u2" });
    db.conversation.create.mockResolvedValue({ id: "new" });
    expect(await getOrCreateConversation("u1", "u2")).toBe("new");
    expect(db.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "ACCEPTED" }) }),
    );
  });

  it("creates a PENDING request when the recipient does not follow the sender", async () => {
    db.conversation.findUnique.mockResolvedValue(null);
    db.follow.findUnique.mockResolvedValue(null);
    db.conversation.create.mockResolvedValue({ id: "new" });
    await getOrCreateConversation("u1", "u2");
    expect(db.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PENDING", requestedById: "u1" }),
      }),
    );
  });
});

describe("createGroupConversation", () => {
  it("rejects fewer than two distinct other members", async () => {
    expect(await createGroupConversation("u1", ["u2"], "G")).toBeNull();
    expect(await createGroupConversation("u1", ["u2", "u2", "u1"], "G")).toBeNull();
    expect(db.conversation.create).not.toHaveBeenCalled();
  });

  it("rejects when fewer than two members actually exist", async () => {
    db.user.findMany.mockResolvedValue([{ id: "u2" }]);
    expect(await createGroupConversation("u1", ["u2", "u3"], "G")).toBeNull();
    expect(db.conversation.create).not.toHaveBeenCalled();
  });

  it("creates a group with a trimmed title and all participants", async () => {
    db.user.findMany.mockResolvedValue([{ id: "u2" }, { id: "u3" }]);
    db.conversation.create.mockResolvedValue({ id: "g1" });
    expect(await createGroupConversation("u1", ["u2", "u3"], "  Squad  ")).toBe("g1");
    expect(db.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: "Squad", status: "ACCEPTED" }),
      }),
    );
  });

  it("stores a null title for a blank name", async () => {
    db.user.findMany.mockResolvedValue([{ id: "u2" }, { id: "u3" }]);
    db.conversation.create.mockResolvedValue({ id: "g1" });
    await createGroupConversation("u1", ["u2", "u3"], "   ");
    expect(db.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ title: null }) }),
    );
  });
});

describe("getConversations", () => {
  const baseRow = (overrides: Record<string, unknown> = {}) => ({
    lastReadAt: null,
    conversation: {
      id: "c1",
      updatedAt: new Date("2026-06-09T00:00:00Z"),
      title: null,
      participants: [{ user: creatorRow("u2", "Mira") }],
      messages: [
        {
          body: "hello",
          createdAt: new Date("2026-06-09T00:00:00Z"),
          senderId: "u2",
          pinId: null,
          imageUrl: null,
        },
      ],
      ...overrides,
    },
  });

  it("builds a 1:1 summary with the unread count", async () => {
    db.conversationParticipant.findMany.mockResolvedValue([baseRow()]);
    db.message.count.mockResolvedValue(2);
    const [summary] = await getConversations("u1");
    expect(summary?.other.name).toBe("Mira");
    expect(summary?.isGroup).toBe(false);
    expect(summary?.title).toBeNull();
    expect(summary?.lastMessage?.body).toBe("hello");
    expect(summary?.unreadCount).toBe(2);
  });

  it("marks a multi-participant conversation as a group", async () => {
    db.conversationParticipant.findMany.mockResolvedValue([
      baseRow({
        title: "Squad",
        participants: [{ user: creatorRow("u2", "Mira") }, { user: creatorRow("u3", "Leo") }],
      }),
    ]);
    db.message.count.mockResolvedValue(0);
    const [summary] = await getConversations("u1");
    expect(summary?.isGroup).toBe(true);
    expect(summary?.others).toHaveLength(2);
    expect(summary?.title).toBe("Squad");
  });

  it("labels attachment-only previews (pin / photo / GIF)", async () => {
    const preview = async (message: Record<string, unknown>): Promise<string | undefined> => {
      db.conversationParticipant.findMany.mockResolvedValue([
        baseRow({ messages: [{ createdAt: new Date(), senderId: "u2", body: "", ...message }] }),
      ]);
      db.message.count.mockResolvedValue(0);
      const [summary] = await getConversations("u1");
      return summary?.lastMessage?.body;
    };
    expect(await preview({ pinId: "p1", imageUrl: null })).toBe("Sent a pin");
    expect(await preview({ pinId: null, imageUrl: "/x.png" })).toBe("Sent a photo");
    expect(await preview({ pinId: null, imageUrl: "/x.gif" })).toBe("Sent a GIF");
  });
});

describe("getMessages", () => {
  it("returns null when the viewer is not a participant", async () => {
    db.conversationParticipant.findUnique.mockResolvedValue(null);
    expect(await getMessages("c1", "u1")).toBeNull();
    expect(db.message.findMany).not.toHaveBeenCalled();
  });

  it("returns messages oldest-first for a participant", async () => {
    db.conversationParticipant.findUnique.mockResolvedValue({ userId: "u1" });
    db.message.findMany.mockResolvedValue([
      {
        id: "m2",
        conversationId: "c1",
        senderId: "u1",
        body: "second",
        createdAt: new Date("2026-06-09T00:01:00Z"),
        pin: null,
        imageUrl: null,
        system: false,
      },
      {
        id: "m1",
        conversationId: "c1",
        senderId: "u1",
        body: "first",
        createdAt: new Date("2026-06-09T00:00:00Z"),
        pin: null,
        imageUrl: null,
        system: false,
      },
    ]);
    const messages = await getMessages("c1", "u1");
    expect(messages?.map((m) => m.id)).toEqual(["m1", "m2"]);
  });
});

describe("getMessageRequests", () => {
  it("builds summaries for pending requests", async () => {
    db.conversationParticipant.findMany.mockResolvedValue([
      {
        lastReadAt: null,
        conversation: {
          id: "c1",
          updatedAt: new Date("2026-06-09T00:00:00Z"),
          title: null,
          participants: [{ user: creatorRow("u2", "Mira") }],
          messages: [],
        },
      },
    ]);
    db.message.count.mockResolvedValue(0);
    const requests = await getMessageRequests("u1");
    expect(requests[0]?.other.name).toBe("Mira");
    expect(requests[0]?.lastMessage).toBeNull();
  });
});

describe("getUnreadConversationIds", () => {
  it("returns only the conversations with unread messages", async () => {
    db.conversationParticipant.findMany.mockResolvedValue([
      { conversationId: "c1", lastReadAt: null },
      { conversationId: "c2", lastReadAt: new Date() },
    ]);
    db.message.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
    const ids = await getUnreadConversationIds("u1");
    expect(ids).toEqual(["c1"]);
  });
});
