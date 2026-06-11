import { createServer, type IncomingMessage, type Server as HttpServer } from "node:http";
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
  pin: { id: string; imageUrl: string; title: string } | null;
  imageUrl: string | null;
  system: boolean;
};

/**
 * The minimal Prisma surface the realtime server needs. Injected so the server
 * can be unit-tested without a database.
 */
export type RealtimePrisma = {
  conversationParticipant: {
    findMany: {
      (args: {
        where: { userId: string };
        select: { conversationId: true };
      }): Promise<{ conversationId: string }[]>;
      (args: {
        where: { conversationId: string };
        select: { userId: true };
      }): Promise<{ userId: string }[]>;
    };
    findUnique(args: {
      where: { conversationId_userId: { conversationId: string; userId: string } };
    }): Promise<{ userId: string } | null>;
  };
  message: {
    create(args: {
      data: {
        conversationId: string;
        senderId: string;
        body: string;
        pinId?: string | null;
        imageUrl?: string | null;
        system?: boolean;
      };
    }): Promise<{ id: string; body: string; createdAt: Date }>;
  };
  pin: {
    findUnique(args: {
      where: { id: string };
      select: { id: true; imageUrl: true; title: true };
    }): Promise<{ id: string; imageUrl: string; title: string } | null>;
  };
  conversation: {
    update(args: { where: { id: string }; data: { updatedAt: Date } }): Promise<unknown>;
  };
  user: {
    update(args: { where: { id: string }; data: { lastSeenAt: Date } }): Promise<unknown>;
    findMany(args: {
      where: { id: { in: string[] } };
      select: { id: true; lastSeenAt: true };
    }): Promise<{ id: string; lastSeenAt: Date | null }[]>;
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
 * The io surface needed to propagate a membership change: joining a set of
 * users' live sockets to a conversation room and emitting to per-user rooms.
 */
export type SyncEmitter = {
  to(room: string): { emit(event: string, payload: unknown): unknown };
  in(room: string): { socketsJoin(rooms: string): void };
};

/**
 * Dependencies for {@link createRealtimeServer}.
 */
export type RealtimeDeps = {
  prisma: RealtimePrisma;
  verifyUser: (handshake: RealtimeHandshake) => Promise<string | null>;
  cors?: { origin: string | string[] | boolean; credentials: boolean };
  /**
   * Shared secret authenticating the internal `POST /internal/emit` endpoint the
   * web process uses to push server-originated events (e.g. notifications) to a
   * user's room. The endpoint is disabled when this is unset.
   */
  internalSecret?: string;
  /**
   * Optional sink for fanning a new message out as a Web Push to its offline
   * recipients. Wired in `index.ts` to the web app's internal push endpoint;
   * left undefined (no push) in tests and when unconfigured.
   */
  notifyPush?: (userIds: string[], payload: unknown) => void;
};

/**
 * Authenticates and dispatches an internal emit request: the web process posts
 * `{ room, event, payload }` so a server-originated event (a notification, say)
 * reaches a user's live sockets. Pure over its inputs so it can be unit-tested
 * without a live HTTP server.
 *
 * @param io - The room-broadcast surface.
 * @param secret - The configured shared secret, or undefined when disabled.
 * @param providedSecret - The `x-internal-secret` header from the request.
 * @param body - The raw JSON request body.
 * @returns The HTTP status code to respond with.
 */
export function dispatchInternalEmit(
  io: RoomEmitter,
  secret: string | undefined,
  providedSecret: string | undefined,
  body: string,
): number {
  if (secret === undefined || secret === "" || providedSecret !== secret) {
    return 401;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return 400;
  }
  const room = readString(parsed, "room");
  const event = readString(parsed, "event");
  if (room === null || event === null) {
    return 400;
  }
  const payload =
    typeof parsed === "object" && parsed !== null
      ? ((parsed as Record<string, unknown>).payload ?? {})
      : {};
  io.to(room).emit(event, payload);
  return 204;
}

/**
 * Reads an HTTP request's body into a string, capped so a malformed or hostile
 * caller cannot exhaust memory.
 *
 * @param req - The incoming request.
 * @returns The body text.
 */
async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 64_000) {
      throw new Error("body too large");
    }
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

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
 * @param push - Optional Web Push sink and the online registry, used to notify
 *   the conversation's offline recipients of the new message.
 */
export async function handleSend(
  io: RoomEmitter,
  prisma: RealtimePrisma,
  userId: string,
  payload: unknown,
  ack: Ack,
  push?: { notify: (userIds: string[], payload: unknown) => void; online: Map<string, number> },
): Promise<void> {
  const conversationId = readString(payload, "conversationId");
  const body = (readString(payload, "body") ?? "").trim();
  const pinId = readString(payload, "pinId");
  const imageUrl = readString(payload, "imageUrl");
  const system =
    typeof payload === "object" &&
    payload !== null &&
    (payload as Record<string, unknown>).system === true;
  if (conversationId === null || (body === "" && pinId === null && imageUrl === null)) {
    ack?.({ ok: false, error: "Invalid message." });
    return;
  }
  if (body.length > 4000) {
    ack?.({ ok: false, error: "Your message is too long." });
    return;
  }
  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (member === null) {
    ack?.({ ok: false, error: "Not a participant." });
    return;
  }
  const pin =
    pinId === null
      ? null
      : await prisma.pin.findUnique({
          where: { id: pinId },
          select: { id: true, imageUrl: true, title: true },
        });
  if (pinId !== null && pin === null) {
    ack?.({ ok: false, error: "That pin no longer exists." });
    return;
  }
  const row = await prisma.message.create({
    data: { conversationId, senderId: userId, body, pinId: pin?.id ?? null, imageUrl, system },
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
    pin,
    imageUrl,
    system,
  };
  io.to(conversationId).emit("message:new", message);
  ack?.({ ok: true, message });

  if (push !== undefined) {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const recipients = participants
      .map((participant) => participant.userId)
      .filter((id) => id !== userId && !push.online.has(id));
    if (recipients.length > 0) {
      push.notify(recipients, {
        title: "New message",
        body: body !== "" ? body.slice(0, 140) : "Sent you a message",
        url: "/messages",
        tag: `message:${conversationId}`,
      });
    }
  }
}

/**
 * Propagates a conversation membership change (a group was just created, or a
 * member left) to a set of users: joins each user's live sockets to the
 * conversation room so they receive its future broadcasts, then asks them to
 * refresh their inbox. The emitter must itself be a participant.
 *
 * @param io - The socket.io server (per-user room join and emit).
 * @param prisma - The injected Prisma surface.
 * @param userId - The authenticated emitter id.
 * @param payload - The raw `conversation:sync` payload (`{ conversationId, userIds }`).
 */
export async function handleSync(
  io: SyncEmitter,
  prisma: RealtimePrisma,
  userId: string,
  payload: unknown,
): Promise<void> {
  const conversationId = readString(payload, "conversationId");
  if (conversationId === null) {
    return;
  }
  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (member === null) {
    return;
  }
  const raw =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).userIds
      : null;
  const userIds = Array.isArray(raw)
    ? raw.filter((id): id is string => typeof id === "string")
    : [];
  for (const targetId of userIds) {
    io.in(`user:${targetId}`).socketsJoin(conversationId);
    io.to(`user:${targetId}`).emit("inbox:refresh", { conversationId });
  }
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
 * Records that a user has one more connected socket. Presence is reference
 * counted so a user is online while any of their tabs is connected.
 *
 * @param online - The presence registry (user id → open socket count).
 * @param userId - The user that connected.
 * @returns True when the user just came online (first socket).
 */
export function markOnline(online: Map<string, number>, userId: string): boolean {
  const count = (online.get(userId) ?? 0) + 1;
  online.set(userId, count);
  return count === 1;
}

/**
 * Records that one of a user's sockets disconnected.
 *
 * @param online - The presence registry.
 * @param userId - The user whose socket closed.
 * @returns True when the user just went offline (last socket).
 */
export function markOffline(online: Map<string, number>, userId: string): boolean {
  const count = (online.get(userId) ?? 1) - 1;
  if (count <= 0) {
    online.delete(userId);
    return true;
  }
  online.set(userId, count);
  return false;
}

/**
 * Answers a client's presence query for a set of users with their current
 * online state and last-seen timestamp.
 *
 * @param prisma - The injected Prisma surface.
 * @param online - The presence registry.
 * @param payload - The raw `presence:get` payload (`{ userIds }`).
 * @param ack - The acknowledgement callback.
 */
export async function handlePresenceGet(
  prisma: RealtimePrisma,
  online: Map<string, number>,
  payload: unknown,
  ack: Ack,
): Promise<void> {
  const raw =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).userIds
      : null;
  const userIds = Array.isArray(raw)
    ? raw.filter((id): id is string => typeof id === "string")
    : [];
  if (userIds.length === 0) {
    ack?.({ ok: true, presence: [] });
    return;
  }
  const rows = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, lastSeenAt: true },
  });
  const presence = userIds.map((id) => {
    const row = rows.find((candidate) => candidate.id === id);
    return {
      userId: id,
      online: online.has(id),
      lastSeenAt: row?.lastSeenAt?.toISOString() ?? null,
    };
  });
  ack?.({ ok: true, presence });
}

/**
 * Joins a socket to every room of the conversations the user belongs to.
 *
 * @param socket - The connected socket.
 * @param prisma - The injected Prisma surface.
 * @param userId - The authenticated user id.
 */
async function joinUserRooms(
  socket: Socket,
  prisma: RealtimePrisma,
  userId: string,
): Promise<void> {
  await socket.join(`user:${userId}`);
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true },
  });
  for (const part of parts) {
    await socket.join(part.conversationId);
  }
}

/**
 * Wires a freshly connected, authenticated socket. Event handlers are
 * registered synchronously so no early message is lost, then the user's
 * conversation rooms are joined.
 *
 * @param io - The socket.io server.
 * @param socket - The connected socket.
 * @param prisma - The injected Prisma surface.
 */
function onConnection(
  io: Server,
  socket: Socket,
  prisma: RealtimePrisma,
  online: Map<string, number>,
  notifyPush?: (userIds: string[], payload: unknown) => void,
): void {
  const userId = socket.data.userId as string;
  const push = notifyPush === undefined ? undefined : { notify: notifyPush, online };
  socket.on("message:send", (payload: unknown, ack: Ack) => {
    void handleSend(io, prisma, userId, payload, ack, push);
  });
  socket.on("conversation:sync", (payload: unknown) => {
    void handleSync(io, prisma, userId, payload);
  });
  socket.on("typing", (payload: unknown) => {
    handleTyping(socket, userId, payload);
  });
  socket.on("presence:get", (payload: unknown, ack: Ack) => {
    void handlePresenceGet(prisma, online, payload, ack);
  });
  socket.on("disconnect", () => {
    if (markOffline(online, userId)) {
      const lastSeenAt = new Date();
      void prisma.user.update({ where: { id: userId }, data: { lastSeenAt } });
      io.emit("presence:update", { userId, online: false, lastSeenAt: lastSeenAt.toISOString() });
    }
  });
  if (markOnline(online, userId)) {
    io.emit("presence:update", { userId, online: true, lastSeenAt: null });
  }
  void joinUserRooms(socket, prisma, userId);
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
  const ref: { io: Server | undefined } = { io: undefined };
  const httpServer = createServer((req, res) => {
    if (req.method === "POST" && req.url === "/internal/emit" && ref.io !== undefined) {
      const provided = req.headers["x-internal-secret"];
      const emitter = ref.io;
      readBody(req)
        .then((body) => {
          const status = dispatchInternalEmit(
            emitter,
            deps.internalSecret,
            typeof provided === "string" ? provided : undefined,
            body,
          );
          res.writeHead(status).end();
        })
        .catch(() => res.writeHead(400).end());
      return;
    }
    res.writeHead(404).end();
  });
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: deps.cors ?? { origin: true, credentials: true },
  });
  ref.io = io;

  const online = new Map<string, number>();

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
    onConnection(io, socket, deps.prisma, online, deps.notifyPush);
  });

  return { io, httpServer };
}
