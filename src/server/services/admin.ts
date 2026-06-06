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
 * Full detail for a single user shown on the admin user page.
 */
export type AdminUserDetail = {
  id: string;
  name: string;
  username: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  verified: boolean;
  disabled: boolean;
  createdAt: Date;
  counts: { pins: number; comments: number; boards: number; followers: number; following: number };
  recentPins: { id: string; title: string; createdAt: Date }[];
  recentComments: { id: string; body: string; pinId: string; pinTitle: string; createdAt: Date }[];
};

/**
 * Loads a single user's profile, counts and recent activity for the admin user
 * page, or null when the user does not exist.
 *
 * @param id - The user id.
 * @returns The user detail, or null.
 */
export async function getAdminUserDetail(id: string): Promise<AdminUserDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      avatarUrl: true,
      role: true,
      verified: true,
      disabled: true,
      createdAt: true,
      _count: {
        select: { pins: true, comments: true, boards: true, followers: true, following: true },
      },
      pins: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, createdAt: true },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          body: true,
          createdAt: true,
          pin: { select: { id: true, title: true } },
        },
      },
    },
  });
  if (user === null) {
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    verified: user.verified,
    disabled: user.disabled,
    createdAt: user.createdAt,
    counts: {
      pins: user._count.pins,
      comments: user._count.comments,
      boards: user._count.boards,
      followers: user._count.followers,
      following: user._count.following,
    },
    recentPins: user.pins,
    recentComments: user.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      pinId: comment.pin.id,
      pinTitle: comment.pin.title,
      createdAt: comment.createdAt,
    })),
  };
}

/**
 * Full detail for a single pin shown on the admin pin page.
 */
export type AdminPinDetail = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  width: number;
  height: number;
  link: string | null;
  createdAt: Date;
  creatorId: string;
  creatorName: string;
  categoryId: string | null;
  counts: { likes: number; comments: number; downloads: number; saves: number; reports: number };
};

/**
 * Loads a single pin's detail, creator and engagement for the admin pin page,
 * or null when the pin does not exist.
 *
 * @param id - The pin id.
 * @returns The pin detail, or null.
 */
export async function getAdminPinDetail(id: string): Promise<AdminPinDetail | null> {
  const pin = await prisma.pin.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      width: true,
      height: true,
      link: true,
      createdAt: true,
      downloadCount: true,
      categoryId: true,
      creator: { select: { id: true, name: true } },
      _count: { select: { likes: true, comments: true, saves: true, reports: true } },
    },
  });
  if (pin === null) {
    return null;
  }
  return {
    id: pin.id,
    title: pin.title,
    description: pin.description,
    imageUrl: pin.imageUrl,
    width: pin.width,
    height: pin.height,
    link: pin.link,
    createdAt: pin.createdAt,
    creatorId: pin.creator.id,
    creatorName: pin.creator.name,
    categoryId: pin.categoryId,
    counts: {
      likes: pin._count.likes,
      comments: pin._count.comments,
      downloads: pin.downloadCount,
      saves: pin._count.saves,
      reports: pin._count.reports,
    },
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
  authorId: string;
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
        author: { select: { id: true, name: true } },
        pin: { select: { id: true, title: true } },
      },
    }),
  ]);
  return {
    rows: rows.map((comment) => ({
      id: comment.id,
      body: comment.body,
      authorId: comment.author.id,
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
 * A category row in the admin categories table.
 */
export type AdminCategoryRow = {
  id: string;
  slug: string;
  label: string;
  imageUrl: string;
  pinCount: number;
};

/**
 * Lists every category with its pin count for the admin categories table,
 * alphabetically by label.
 *
 * @returns The categories.
 */
export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  const rows = await prisma.category.findMany({
    orderBy: { label: "asc" },
    select: {
      id: true,
      slug: true,
      label: true,
      imageUrl: true,
      _count: { select: { pins: true } },
    },
  });
  return rows.map((category) => ({
    id: category.id,
    slug: category.slug,
    label: category.label,
    imageUrl: category.imageUrl,
    pinCount: category._count.pins,
  }));
}

/**
 * Number of reports shown per page in the admin reports queue.
 */
export const ADMIN_REPORTS_PAGE_SIZE = 20;

/**
 * A report row in the admin reports queue.
 */
export type AdminReportRow = {
  id: string;
  reason: string | null;
  reporterName: string;
  reporterEmail: string;
  pinId: string;
  pinTitle: string;
  createdAt: Date;
};

/**
 * A page of pending reports.
 */
export type AdminReportsPage = {
  rows: AdminReportRow[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Lists pending reports for the moderation queue, oldest first and paginated.
 *
 * @param page - The 1-based page number.
 * @returns The pending reports and pagination metadata.
 */
export async function getAdminReports(page: number): Promise<AdminReportsPage> {
  const current = Math.max(1, page);
  const where = { status: "PENDING" as const };
  const [total, rows] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (current - 1) * ADMIN_REPORTS_PAGE_SIZE,
      take: ADMIN_REPORTS_PAGE_SIZE,
      select: {
        id: true,
        reason: true,
        createdAt: true,
        reporter: { select: { name: true, email: true } },
        pin: { select: { id: true, title: true } },
      },
    }),
  ]);
  return {
    rows: rows.map((report) => ({
      id: report.id,
      reason: report.reason,
      reporterName: report.reporter.name,
      reporterEmail: report.reporter.email,
      pinId: report.pin.id,
      pinTitle: report.pin.title,
      createdAt: report.createdAt,
    })),
    total,
    page: current,
    pageSize: ADMIN_REPORTS_PAGE_SIZE,
  };
}

/**
 * Aggregate counts and recent activity shown on the admin dashboard.
 */
export type AdminOverview = {
  counts: { users: number; pins: number; comments: number; boards: number; pendingReports: number };
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
  const [users, pins, comments, boards, pendingReports, recentUsers, recentPins] =
    await Promise.all([
      prisma.user.count(),
      prisma.pin.count(),
      prisma.comment.count(),
      prisma.board.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
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
    counts: { users, pins, comments, boards, pendingReports },
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
