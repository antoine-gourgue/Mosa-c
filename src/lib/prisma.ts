import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Creates a Prisma client backed by the node-postgres driver adapter using the
 * validated `DATABASE_URL`.
 *
 * @returns A configured Prisma client.
 */
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

/**
 * Shared Prisma client singleton. A single instance is reused across hot
 * reloads in development to avoid exhausting database connections.
 */
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
