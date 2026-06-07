import { createServer, type Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";

/**
 * A direct message as broadcast over the socket.
 */
export type RealtimeMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

/**
 * The minimal Prisma surface the realtime server needs. Injected so the server
 * can be unit-tested without a database.
 */
export type RealtimePrisma = {
  conversationParticipant: {
    findMany(args: {
      where: { userId: string };
      select: { conversationId: true };
    }): Promise<{ conversationId: string }[]>;
    findUnique(args: {
      where: { conversationId_userId: { conversationId: string; userId: string } };
    }): Promise<{ userId: string } | null>;
  };
  message: {
    create(args: {
      data: { conversationId: string; senderId: string; body: string };
    }): Promise<{ id: string; body: string; createdAt: Date }>;
  };
  conversation: {
    update(args: { where: { id: string }; data: { updatedAt: Date } }): Promise<unknown>;
  };
};

/**
 * The handshake fields the server reads to authenticate a connection.
 */
export type RealtimeHandshake = {
  headers: Record<string, string | string[] | undefined>;
  auth?: Record<string, unknown>;
};

/**
 * The minimal room-broadcast surface shared by the io server and a socket,
 * narrowed so the handlers can be unit-tested with a plain mock.
 */
export type RoomEmitter = {
  to(room: string): { emit(event: string, payload: unknown): unknown };
};

/**
 * Dependencies for {@link createRealtimeServer}.
 */
export type RealtimeDeps = {
  prisma: RealtimePrisma;
  verifyUser: (handshake: RealtimeHandshake) => Promise<string | null>;
  cors?: { origin: string | string[] | boolean; credentials: boolean };
};

type Ack = ((response: unknown) => void) | undefined;

/**
 * Reads a string field from an unknown socket payload.
 *
 * @param payload - The raw payload.
 * @param key - The field name.
 * @returns The string value, or null when absent or not a string.
 */
function readString(payload: unknown, key: string): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

/**
 * Persists and broadcasts a message sent over the socket, after authorizing the
 * sender's membership of the conversation.
 *
 * @param io - The socket.io server.
 * @param prisma - The injected Prisma surface.
 * @param userId - The authenticated sender id.
 * @param payload - The raw `message:send` payload.
 * @param ack - The optional client acknowledgement callback.
 */
export async function handleSend(
  io: RoomEmitter,
  prisma: RealtimePrisma,
  userId: string,
  payload: unknown,
  ack: Ack,
): Promise<void> {
  const conversationId = readString(payload, "conversationId");
  const body = (readString(payload, "body") ?? "").trim();
  if (conversationId === null || body === "") {
    ack?.({ ok: false, error: "Invalid message." });
    return;
  }
  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (member === null) {
    ack?.({ ok: false, error: "Not a participant." });
    return;
  }
  const row = await prisma.message.create({
    data: { conversationId, senderId: userId, body: body.slice(0, 4000) },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  const message: RealtimeMessage = {
    id: row.id,
    conversationId,
    senderId: userId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
  io.to(conversationId).emit("message:new", message);
  ack?.({ ok: true, message });
}

/**
 * Relays a typing indicator to the other participants of a conversation.
 *
 * @param socket - The sender's socket.
 * @param userId - The authenticated sender id.
 * @param payload - The raw `typing` payload.
 */
export function handleTyping(socket: RoomEmitter, userId: string, payload: unknown): void {
  const conversationId = readString(payload, "conversationId");
  if (conversationId === null) {
    return;
  }
  const typing =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).typing === true
      : false;
  socket.to(conversationId).emit("typing", { conversationId, userId, typing });
}

/**
 * Wires a freshly connected, authenticated socket: it joins the user's
 * conversation rooms and handles message and typing events.
 *
 * @param io - The socket.io server.
 * @param socket - The connected socket.
 * @param prisma - The injected Prisma surface.
 */
async function onConnection(io: Server, socket: Socket, prisma: RealtimePrisma): Promise<void> {
  const userId = socket.data.userId as string;
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });
  for (const part of parts) {
    await socket.join(part.conversationId);
  }
  socket.on("message:send", (payload: unknown, ack: Ack) => {
    void handleSend(io, prisma, userId, payload, ack);
  });
  socket.on("typing", (payload: unknown) => {
    handleTyping(socket, userId, payload);
  });
}

/**
 * Creates the realtime socket.io server. Every connection is authenticated on
 * the handshake; authenticated sockets join their conversation rooms and can
 * send messages (persisted and broadcast) and typing indicators. Returns the
 * io and http servers so the caller controls the lifecycle (and can plug a
 * Redis adapter for multi-instance scaling).
 *
 * @param deps - The Prisma surface, the handshake verifier and CORS options.
 * @returns The socket.io server and its underlying http server.
 */
export function createRealtimeServer(deps: RealtimeDeps): { io: Server; httpServer: HttpServer } {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: deps.cors ?? { origin: true, credentials: true },
  });

  io.use((socket, next) => {
    deps
      .verifyUser(socket.handshake)
      .then((userId) => {
        if (userId === null) {
          next(new Error("unauthorized"));
          return;
        }
        socket.data.userId = userId;
        next();
      })
      .catch(() => next(new Error("unauthorized")));
  });

  io.on("connection", (socket) => {
    void onConnection(io, socket, deps.prisma);
  });

  return { io, httpServer };
}
