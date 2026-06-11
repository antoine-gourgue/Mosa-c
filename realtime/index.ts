import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { userIdFromCookieHeader } from "./auth";
import { createRealtimeServer, type RealtimePrisma } from "./server";

const port = Number(process.env.REALTIME_PORT ?? 4001);
const secret = process.env.AUTH_SECRET;
const databaseUrl = process.env.DATABASE_URL;

if (secret === undefined || secret === "" || databaseUrl === undefined || databaseUrl === "") {
  throw new Error("AUTH_SECRET and DATABASE_URL are required to run the realtime server.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const corsOrigin = process.env.REALTIME_CORS_ORIGIN;

const { io, httpServer } = createRealtimeServer({
  prisma: prisma as unknown as RealtimePrisma,
  cors: { origin: corsOrigin === undefined ? true : corsOrigin, credentials: true },
  internalSecret: process.env.REALTIME_INTERNAL_SECRET,
  verifyUser: (handshake) =>
    userIdFromCookieHeader(
      typeof handshake.headers.cookie === "string" ? handshake.headers.cookie : undefined,
      secret,
    ),
});

/**
 * Multi-instance scaling: set REALTIME_REDIS_URL and install
 * `@socket.io/redis-adapter` + `redis`, then attach the adapter here. No other
 * code changes are needed.
 *
 * import { createAdapter } from "@socket.io/redis-adapter";
 * import { createClient } from "redis";
 * const pub = createClient({ url: process.env.REALTIME_REDIS_URL });
 * const sub = pub.duplicate();
 * await Promise.all([pub.connect(), sub.connect()]);
 * io.adapter(createAdapter(pub, sub));
 */
void io;

httpServer.listen(port, () => {
  process.stdout.write(`realtime server listening on :${port}\n`);
});
