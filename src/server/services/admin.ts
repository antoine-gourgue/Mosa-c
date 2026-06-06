import { prisma } from "@/lib/prisma";

/**
 * Number of users shown per page in the admin users table.
 */
export const ADMIN_USERS_PAGE_SIZE = 20;

/**
 * A user row in the admin users table.
 */
export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: "USER" | "ADMIN";
  verified: boolean;
  disabled: boolean;
  createdAt: Date;
  pinCount: number;
};

/**
 * A page of users for the admin table.
 */
export type AdminUsersPage = {
  rows: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Lists users for the admin table, optionally filtered by a case-insensitive
 * search across name, email and username, newest first and paginated.
 *
 * @param query - The search term (empty matches everyone).
 * @param page - The 1-based page number.
 * @returns The matching users and pagination metadata.
 */
export async function getAdminUsers(query: string, page: number): Promise<AdminUsersPage> {
  const trimmed = query.trim();
  const where =
    trimmed === ""
      ? {}
      : {
          OR: [
            { name: { contains: trimmed, mode: "insensitive" as const } },
            { email: { contains: trimmed, mode: "insensitive" as const } },
            { username: { contains: trimmed, mode: "insensitive" as const } },
          ],
        };
  const current = Math.max(1, page);
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (current - 1) * ADMIN_USERS_PAGE_SIZE,
      take: ADMIN_USERS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        verified: true,
        disabled: true,
        createdAt: true,
        _count: { select: { pins: true } },
      },
    }),
  ]);
  return {
    rows: rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      verified: user.verified,
      disabled: user.disabled,
      createdAt: user.createdAt,
      pinCount: user._count.pins,
    })),
    total,
    page: current,
    pageSize: ADMIN_USERS_PAGE_SIZE,
  };
}

/**
 * Number of pins shown per page in the admin moderation table.
 */
export const ADMIN_PINS_PAGE_SIZE = 20;

/**
 * Number of comments shown per page in the admin moderation table.
 */
export const ADMIN_COMMENTS_PAGE_SIZE = 20;

/**
 * A pin row in the admin moderation table.
 */
export type AdminPinRow = {
  id: string;
  title: string;
  imageUrl: string;
  creatorName: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
};

/**
 * A page of pins for moderation.
 */
export type AdminPinsPage = {
  rows: AdminPinRow[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * A comment row in the admin moderation table.
 */
export type AdminCommentRow = {
  id: string;
  body: string;
  authorName: string;
  pinId: string;
  pinTitle: string;
  createdAt: Date;
};

/**
 * A page of comments for moderation.
 */
export type AdminCommentsPage = {
  rows: AdminCommentRow[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Lists pins for moderation, optionally filtered by a case-insensitive search
 * across title and description, newest first and paginated.
 *
 * @param query - The search term (empty matches everything).
 * @param page - The 1-based page number.
 * @returns The matching pins and pagination metadata.
 */
export async function getAdminPins(query: string, page: number): Promise<AdminPinsPage> {
  const trimmed = query.trim();
  const where =
    trimmed === ""
      ? {}
      : {
          OR: [
            { title: { contains: trimmed, mode: "insensitive" as const } },
            { description: { contains: trimmed, mode: "insensitive" as const } },
          ],
        };
  const current = Math.max(1, page);
  const [total, rows] = await Promise.all([
    prisma.pin.count({ where }),
    prisma.pin.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (current - 1) * ADMIN_PINS_PAGE_SIZE,
      take: ADMIN_PINS_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        imageUrl: true,
        createdAt: true,
        creator: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    }),
  ]);
  return {
    rows: rows.map((pin) => ({
      id: pin.id,
      title: pin.title,
      imageUrl: pin.imageUrl,
      creatorName: pin.creator.name,
      likeCount: pin._count.likes,
      commentCount: pin._count.comments,
      createdAt: pin.createdAt,
    })),
    total,
    page: current,
    pageSize: ADMIN_PINS_PAGE_SIZE,
  };
}

/**
 * Lists comments for moderation, newest first and paginated.
 *
 * @param page - The 1-based page number.
 * @returns The comments and pagination metadata.
 */
export async function getAdminComments(page: number): Promise<AdminCommentsPage> {
  const current = Math.max(1, page);
  const [total, rows] = await Promise.all([
    prisma.comment.count(),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      skip: (current - 1) * ADMIN_COMMENTS_PAGE_SIZE,
      take: ADMIN_COMMENTS_PAGE_SIZE,
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: { name: true } },
        pin: { select: { id: true, title: true } },
      },
    }),
  ]);
  return {
    rows: rows.map((comment) => ({
      id: comment.id,
      body: comment.body,
      authorName: comment.author.name,
      pinId: comment.pin.id,
      pinTitle: comment.pin.title,
      createdAt: comment.createdAt,
    })),
    total,
    page: current,
    pageSize: ADMIN_COMMENTS_PAGE_SIZE,
  };
}

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
