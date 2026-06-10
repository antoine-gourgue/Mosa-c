import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns: string) => {
    const en = (await import("../../../messages/en.json")).default as unknown as Record<
      string,
      Record<string, string>
    >;
    return (key: string) => en[ns]?.[key] ?? key;
  },
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ put: vi.fn(async () => ({ url: "/uploads/x.png" })) }),
}));
vi.mock("@/server/services/users", () => ({
  searchMentionUsers: vi.fn(),
  getSuggestedCreators: vi.fn(async () => []),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversationParticipant: {
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(),
    },
    message: { create: vi.fn(), count: vi.fn(async () => 0), findMany: vi.fn(async () => []) },
    user: { findMany: vi.fn() },
    pin: { findUnique: vi.fn() },
    conversation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      delete: vi.fn(),
    },
    follow: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchMentionUsers } from "@/server/services/users";
import {
  acceptRequest,
  createGroup,
  declineRequest,
  deleteConversation,
  fetchMessages,
  leaveConversation,
  loadInbox,
  markConversationRead,
  searchGifs,
  searchRecipients,
  sendMessage,
  startConversation,
  uploadMessageImage,
} from "./messages";

const db = prisma as unknown as {
  conversationParticipant: {
    updateMany: Mock;
    deleteMany: Mock;
    count: Mock;
    findMany: Mock;
    findUnique: Mock;
  };
  message: { create: Mock; count: Mock; findMany: Mock };
  user: { findMany: Mock };
  pin: { findUnique: Mock };
  conversation: {
    findUnique: Mock;
    findFirst: Mock;
    create: Mock;
    update: Mock;
    updateMany: Mock;
    deleteMany: Mock;
    delete: Mock;
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

describe("createGroup", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await createGroup(["u2", "u3"], "G")).ok).toBe(false);
  });

  it("rejects when fewer than two valid members are given", async () => {
    db.user.findMany.mockResolvedValue([{ id: "u2" }]);
    expect((await createGroup(["u2", "u3"], "G")).ok).toBe(false);
  });

  it("creates a group and returns its id", async () => {
    db.user.findMany.mockResolvedValue([{ id: "u2" }, { id: "u3" }]);
    db.conversation.create.mockResolvedValue({ id: "g1" });
    expect(await createGroup(["u2", "u3"], "Squad")).toEqual({ ok: true, conversationId: "g1" });
  });
});

describe("leaveConversation", () => {
  it("removes the participant and keeps the conversation when members remain", async () => {
    db.conversationParticipant.deleteMany.mockResolvedValue({ count: 1 });
    db.conversationParticipant.count.mockResolvedValue(2);
    expect(await leaveConversation("c1")).toEqual({ ok: true });
    expect(db.conversation.delete).not.toHaveBeenCalled();
  });

  it("deletes the conversation once fewer than two members remain", async () => {
    db.conversationParticipant.deleteMany.mockResolvedValue({ count: 1 });
    db.conversationParticipant.count.mockResolvedValue(1);
    db.conversation.delete.mockResolvedValue({});
    await leaveConversation("c1");
    expect(db.conversation.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  it("rejects when the user was not a participant", async () => {
    db.conversationParticipant.deleteMany.mockResolvedValue({ count: 0 });
    expect((await leaveConversation("c1")).ok).toBe(false);
  });
});

describe("deleteConversation", () => {
  it("deletes a conversation the user belongs to", async () => {
    db.conversation.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteConversation("c1")).toEqual({ ok: true });
  });

  it("rejects when nothing was deleted", async () => {
    db.conversation.deleteMany.mockResolvedValue({ count: 0 });
    expect((await deleteConversation("c1")).ok).toBe(false);
  });
});

describe("uploadMessageImage", () => {
  const form = (file?: File): FormData => {
    const fd = new FormData();
    if (file !== undefined) {
      fd.set("image", file);
    }
    return fd;
  };

  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await uploadMessageImage(form())).ok).toBe(false);
  });

  it("rejects a missing or non-image file", async () => {
    expect((await uploadMessageImage(form())).ok).toBe(false);
    const txt = new File(["x"], "a.txt", { type: "text/plain" });
    expect((await uploadMessageImage(form(txt))).ok).toBe(false);
  });

  it("stores an image and returns its url", async () => {
    const png = new File(["x"], "a.png", { type: "image/png" });
    expect(await uploadMessageImage(form(png))).toEqual({ ok: true, url: "/uploads/x.png" });
  });
});

describe("searchGifs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns no GIFs when no API key is configured", async () => {
    vi.stubEnv("GIPHY_API_KEY", "");
    expect(await searchGifs("cat")).toEqual({ gifs: [] });
  });

  it("maps Giphy results when a key is set", async () => {
    vi.stubEnv("GIPHY_API_KEY", "key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                id: "g1",
                images: {
                  fixed_height: { url: "/g1.gif" },
                  fixed_height_small: { url: "/g1s.gif" },
                },
              },
            ],
          }),
      }),
    );
    const result = await searchGifs("cat");
    expect(result.gifs).toEqual([{ id: "g1", url: "/g1.gif", preview: "/g1s.gif" }]);
  });

  it("returns no GIFs when the Giphy request fails", async () => {
    vi.stubEnv("GIPHY_API_KEY", "key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await searchGifs("cat")).toEqual({ gifs: [] });
  });
});

describe("searchRecipients", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await searchRecipients("a")).ok).toBe(false);
  });

  it("returns matching users when signed in", async () => {
    vi.mocked(searchMentionUsers).mockResolvedValue([
      { id: "u2", name: "Mira", username: "mira", avatarUrl: null },
    ]);
    const result = await searchRecipients("mi");
    expect(result).toEqual({
      ok: true,
      users: [{ id: "u2", name: "Mira", username: "mira", avatarUrl: null }],
    });
  });
});

describe("sendMessage with a shared pin", () => {
  it("attaches an existing pin to the message", async () => {
    db.conversation.findFirst.mockResolvedValue({ status: "ACCEPTED", requestedById: null });
    db.pin.findUnique.mockResolvedValue({ id: "p1" });
    db.$transaction.mockResolvedValue([
      {
        id: "m1",
        conversationId: "c1",
        senderId: "u1",
        body: "",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        pin: { id: "p1", imageUrl: "/p.png", title: "Pin" },
        imageUrl: null,
        system: false,
      },
      {},
    ]);
    const result = await sendMessage("c1", "", "p1");
    expect(result).toMatchObject({ ok: true, message: { pin: { id: "p1" } } });
  });

  it("rejects a pin that no longer exists", async () => {
    db.conversation.findFirst.mockResolvedValue({ status: "ACCEPTED", requestedById: null });
    db.pin.findUnique.mockResolvedValue(null);
    expect((await sendMessage("c1", "", "missing")).ok).toBe(false);
  });
});

describe("loadInbox", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await loadInbox()).ok).toBe(false);
  });

  it("returns conversations, requests and suggestions", async () => {
    const result = await loadInbox();
    expect(result).toMatchObject({ ok: true, conversations: [], requests: [], suggestions: [] });
  });
});

describe("fetchMessages", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await fetchMessages("c1")).ok).toBe(false);
  });

  it("rejects when the viewer is not a participant", async () => {
    db.conversationParticipant.findUnique.mockResolvedValue(null);
    expect((await fetchMessages("c1")).ok).toBe(false);
  });

  it("returns the conversation's messages for a participant", async () => {
    db.conversationParticipant.findUnique.mockResolvedValue({ userId: "u1" });
    db.message.findMany.mockResolvedValue([
      {
        id: "m1",
        conversationId: "c1",
        senderId: "u1",
        body: "hi",
        createdAt: new Date("2026-01-01T00:00:00Z"),
        pin: null,
        imageUrl: null,
        system: false,
      },
    ]);
    const result = await fetchMessages("c1");
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.messages[0]?.id).toBe("m1");
    }
  });
});
