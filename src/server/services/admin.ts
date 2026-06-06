import { prisma } from "@/lib/prisma";

/**
 * Aggregate counts and recent activity shown on the admin dashboard.
 */
export type AdminOverview = {
  counts: { users: number; pins: number; comments: number; boards: number };
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    createdAt: Date;
  }[];
  recentPins: {
    id: string;
    title: string;
    imageUrl: string;
    creatorName: string;
    createdAt: Date;
  }[];
};

/**
 * Loads the admin dashboard overview: headline counts plus the most recent
 * users and pins. Intended for admin-only server contexts.
 *
 * @returns The dashboard overview data.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const [users, pins, comments, boards, recentUsers, recentPins] = await Promise.all([
    prisma.user.count(),
    prisma.pin.count(),
    prisma.comment.count(),
    prisma.board.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.pin.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        createdAt: true,
        creator: { select: { name: true } },
      },
    }),
  ]);

  return {
    counts: { users, pins, comments, boards },
    recentUsers,
    recentPins: recentPins.map((pin) => ({
      id: pin.id,
      title: pin.title,
      imageUrl: pin.imageUrl,
      creatorName: pin.creator.name,
      createdAt: pin.createdAt,
    })),
  };
}
