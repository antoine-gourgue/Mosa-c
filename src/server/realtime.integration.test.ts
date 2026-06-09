import type { AddressInfo } from "node:net";
import { io as ioClient, type Socket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createRealtimeServer, type RealtimePrisma } from "../../realtime/server";

const prisma = {
  conversationParticipant: {
    findMany: vi.fn().mockResolvedValue([{ conversationId: "c1" }]),
    findUnique: vi.fn().mockResolvedValue({ userId: "uA" }),
  },
  message: {
    create: vi.fn().mockResolvedValue({ id: "m1", body: "hi", createdAt: new Date() }),
  },
  pin: { findUnique: vi.fn() },
  conversation: { update: vi.fn().mockResolvedValue({}) },
  user: { update: vi.fn().mockResolvedValue({}), findMany: vi.fn().mockResolvedValue([]) },
} as unknown as RealtimePrisma;

const server = createRealtimeServer({ prisma, verifyUser: async () => "uA" });
let port = 0;

beforeAll(async () => {
  await new Promise<void>((resolve) => server.httpServer.listen(0, resolve));
  port = (server.httpServer.address() as AddressInfo).port;
});

afterAll(async () => {
  server.io.close();
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
});

function connect(): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}`, {
      path: "/socket.io",
      transports: ["websocket"],
      reconnection: false,
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", reject);
  });
}

describe("realtime server (integration)", () => {
  it("authenticates, joins the user's rooms and broadcasts a sent message", async () => {
    const socket = await connect();
    try {
      const received = new Promise((resolve) => socket.on("message:new", resolve));
      const ack = (await socket
        .timeout(2000)
        .emitWithAck("message:send", { conversationId: "c1", body: "hi" })) as {
        ok: boolean;
      };
      expect(ack.ok).toBe(true);
      expect(await received).toMatchObject({ conversationId: "c1", body: "hi" });
    } finally {
      socket.close();
    }
  });

  it("answers a presence query over the socket", async () => {
    const socket = await connect();
    try {
      const response = (await socket
        .timeout(2000)
        .emitWithAck("presence:get", { userIds: ["uA"] })) as {
        ok: boolean;
        presence: { userId: string; online: boolean }[];
      };
      expect(response.ok).toBe(true);
      expect(response.presence[0]?.userId).toBe("uA");
    } finally {
      socket.close();
    }
  });
});

describe("realtime server (unauthorized)", () => {
  it("rejects a handshake the verifier denies", async () => {
    const denied = createRealtimeServer({ prisma, verifyUser: async () => null });
    await new Promise<void>((resolve) => denied.httpServer.listen(0, resolve));
    const deniedPort = (denied.httpServer.address() as AddressInfo).port;
    try {
      await expect(
        new Promise((resolve, reject) => {
          const socket = ioClient(`http://localhost:${deniedPort}`, {
            path: "/socket.io",
            transports: ["websocket"],
            reconnection: false,
          });
          socket.on("connect", () => resolve("connected"));
          socket.on("connect_error", (error) => reject(error));
        }),
      ).rejects.toThrow();
    } finally {
      denied.io.close();
      await new Promise<void>((resolve) => denied.httpServer.close(() => resolve()));
    }
  });
});
