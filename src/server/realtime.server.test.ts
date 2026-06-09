import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handlePresenceGet,
  handleSend,
  handleSync,
  handleTyping,
  markOffline,
  markOnline,
  type RealtimePrisma,
  type RoomEmitter,
  type SyncEmitter,
} from "../../realtime/server";

function makeEmitter(): {
  mock: RoomEmitter;
  to: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
} {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));
  return { mock: { to } as unknown as RoomEmitter, to, emit };
}

const prisma = {
  conversationParticipant: { findUnique: vi.fn(), findMany: vi.fn() },
  message: { create: vi.fn() },
  conversation: { update: vi.fn() },
  pin: { findUnique: vi.fn() },
  user: { update: vi.fn(), findMany: vi.fn() },
};
const db = prisma as unknown as RealtimePrisma;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleSend", () => {
  it("persists and broadcasts a message from a participant", async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue({ userId: "uA" });
    prisma.message.create.mockResolvedValue({
      id: "m1",
      body: "hi",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    prisma.conversation.update.mockResolvedValue({});
    const io = makeEmitter();
    const ack = vi.fn();

    await handleSend(io.mock, db, "uA", { conversationId: "c1", body: " hi " }, ack);

    expect(prisma.message.create).toHaveBeenCalledOnce();
    expect(io.to).toHaveBeenCalledWith("c1");
    expect(io.emit).toHaveBeenCalledWith(
      "message:new",
      expect.objectContaining({ body: "hi", conversationId: "c1", senderId: "uA" }),
    );
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it("rejects a non-participant", async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue(null);
    const io = makeEmitter();
    const ack = vi.fn();

    await handleSend(io.mock, db, "uA", { conversationId: "c1", body: "hi" }, ack);

    expect(prisma.message.create).not.toHaveBeenCalled();
    expect(io.emit).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it("rejects an empty body before any lookup", async () => {
    const io = makeEmitter();
    const ack = vi.fn();

    await handleSend(io.mock, db, "uA", { conversationId: "c1", body: "   " }, ack);

    expect(prisma.conversationParticipant.findUnique).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it("rejects a body over the length limit", async () => {
    const io = makeEmitter();
    const ack = vi.fn();
    await handleSend(io.mock, db, "uA", { conversationId: "c1", body: "x".repeat(4001) }, ack);
    expect(prisma.conversationParticipant.findUnique).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it("attaches a shared pin and broadcasts it", async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue({ userId: "uA" });
    prisma.pin.findUnique.mockResolvedValue({ id: "p1", imageUrl: "/p.png", title: "Pin" });
    prisma.message.create.mockResolvedValue({ id: "m1", body: "", createdAt: new Date() });
    prisma.conversation.update.mockResolvedValue({});
    const io = makeEmitter();
    const ack = vi.fn();
    await handleSend(io.mock, db, "uA", { conversationId: "c1", pinId: "p1" }, ack);
    expect(io.emit).toHaveBeenCalledWith(
      "message:new",
      expect.objectContaining({ pin: { id: "p1", imageUrl: "/p.png", title: "Pin" } }),
    );
  });

  it("rejects a pin that no longer exists", async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue({ userId: "uA" });
    prisma.pin.findUnique.mockResolvedValue(null);
    const io = makeEmitter();
    const ack = vi.fn();
    await handleSend(io.mock, db, "uA", { conversationId: "c1", pinId: "ghost" }, ack);
    expect(prisma.message.create).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it("broadcasts an image-only message flagged as a system event", async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue({ userId: "uA" });
    prisma.message.create.mockResolvedValue({ id: "m2", body: "left", createdAt: new Date() });
    prisma.conversation.update.mockResolvedValue({});
    const io = makeEmitter();
    const ack = vi.fn();
    await handleSend(
      io.mock,
      db,
      "uA",
      { conversationId: "c1", body: "left", imageUrl: "/x.gif", system: true },
      ack,
    );
    expect(io.emit).toHaveBeenCalledWith(
      "message:new",
      expect.objectContaining({ imageUrl: "/x.gif", system: true }),
    );
  });
});

describe("handleSync", () => {
  function makeSync(): {
    mock: SyncEmitter;
    to: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
    socketsJoin: ReturnType<typeof vi.fn>;
  } {
    const emit = vi.fn();
    const socketsJoin = vi.fn();
    const to = vi.fn(() => ({ emit }));
    const inFn = vi.fn(() => ({ socketsJoin }));
    return { mock: { to, in: inFn } as unknown as SyncEmitter, to, emit, in: inFn, socketsJoin };
  }

  it("joins each target's sockets to the room and asks them to refresh", async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue({ userId: "uA" });
    const io = makeSync();

    await handleSync(io.mock, db, "uA", { conversationId: "c1", userIds: ["uB", "uC"] });

    expect(io.in).toHaveBeenCalledWith("user:uB");
    expect(io.socketsJoin).toHaveBeenCalledWith("c1");
    expect(io.to).toHaveBeenCalledWith("user:uC");
    expect(io.emit).toHaveBeenCalledWith("inbox:refresh", { conversationId: "c1" });
  });

  it("ignores a sync from a non-participant", async () => {
    prisma.conversationParticipant.findUnique.mockResolvedValue(null);
    const io = makeSync();

    await handleSync(io.mock, db, "uA", { conversationId: "c1", userIds: ["uB"] });

    expect(io.socketsJoin).not.toHaveBeenCalled();
    expect(io.emit).not.toHaveBeenCalled();
  });
});

describe("presence", () => {
  it("reference-counts online sockets", () => {
    const online = new Map<string, number>();
    expect(markOnline(online, "uA")).toBe(true);
    expect(markOnline(online, "uA")).toBe(false);
    expect(markOffline(online, "uA")).toBe(false);
    expect(markOffline(online, "uA")).toBe(true);
    expect(online.has("uA")).toBe(false);
  });

  it("answers a presence query with online state and last-seen", async () => {
    const online = new Map<string, number>([["uA", 1]]);
    prisma.user.findMany.mockResolvedValue([
      { id: "uB", lastSeenAt: new Date("2026-01-01T00:00:00Z") },
    ]);
    const ack = vi.fn();
    await handlePresenceGet(db, online, { userIds: ["uA", "uB"] }, ack);
    expect(ack).toHaveBeenCalledWith({
      ok: true,
      presence: [
        { userId: "uA", online: true, lastSeenAt: null },
        { userId: "uB", online: false, lastSeenAt: "2026-01-01T00:00:00.000Z" },
      ],
    });
  });
});

describe("handleTyping", () => {
  it("relays a typing indicator to the room without echoing to the sender", () => {
    const socket = makeEmitter();
    handleTyping(socket.mock, "uA", { conversationId: "c1", typing: true });
    expect(socket.to).toHaveBeenCalledWith("c1");
    expect(socket.emit).toHaveBeenCalledWith("typing", {
      conversationId: "c1",
      userId: "uA",
      typing: true,
    });
  });

  it("ignores a payload without a conversation id", () => {
    const socket = makeEmitter();
    handleTyping(socket.mock, "uA", { typing: true });
    expect(socket.to).not.toHaveBeenCalled();
  });
});
