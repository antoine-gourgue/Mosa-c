import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    pin: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    comment: { count: vi.fn(), findMany: vi.fn() },
    report: { count: vi.fn(), findMany: vi.fn() },
    board: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getAdminComments,
  getAdminOverview,
  getAdminPinDetail,
  getAdminPins,
  getAdminReports,
  getAdminUserDetail,
  getAdminUsers,
} from "./admin";

const db = prisma as unknown as {
  user: { count: Mock; findMany: Mock; findUnique: Mock };
  pin: { count: Mock; findMany: Mock; findUnique: Mock };
  comment: { count: Mock; findMany: Mock };
  report: { count: Mock; findMany: Mock };
  board: { count: Mock };
};

const D = new Date("2026-06-09T00:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAdminUsers", () => {
  const row = {
    id: "u1",
    name: "Ada",
    email: "a@x.com",
    username: "ada",
    role: "USER",
    verified: false,
    disabled: false,
    createdAt: D,
    _count: { pins: 3 },
  };

  it("lists users with no filter and projects the pin count", async () => {
    db.user.count.mockResolvedValue(1);
    db.user.findMany.mockResolvedValue([row]);
    const page = await getAdminUsers("", 1);
    expect(page).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    expect(page.rows[0]).toMatchObject({ id: "u1", pinCount: 3 });
    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it("applies a case-insensitive search filter and clamps the page", async () => {
    db.user.count.mockResolvedValue(0);
    db.user.findMany.mockResolvedValue([]);
    const page = await getAdminUsers("  ada  ", 0);
    expect(page.page).toBe(1);
    const args = db.user.findMany.mock.calls[0]?.[0];
    expect(args.where.OR).toHaveLength(3);
  });
});

describe("getAdminUserDetail", () => {
  it("returns null when the user does not exist", async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect(await getAdminUserDetail("u1")).toBeNull();
  });

  it("maps counts and recent activity", async () => {
    db.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Ada",
      username: "ada",
      email: "a@x.com",
      bio: null,
      avatarUrl: null,
      role: "ADMIN",
      verified: true,
      disabled: false,
      createdAt: D,
      _count: { pins: 2, comments: 1, boards: 3, followers: 4, following: 5 },
      pins: [{ id: "p1", title: "Pin", createdAt: D }],
      comments: [{ id: "c1", body: "hi", createdAt: D, pin: { id: "p1", title: "Pin" } }],
    });
    const detail = await getAdminUserDetail("u1");
    expect(detail?.counts).toEqual({ pins: 2, comments: 1, boards: 3, followers: 4, following: 5 });
    expect(detail?.recentComments[0]).toMatchObject({ pinId: "p1", pinTitle: "Pin" });
  });
});

describe("getAdminPinDetail", () => {
  it("returns null when the pin is missing", async () => {
    db.pin.findUnique.mockResolvedValue(null);
    expect(await getAdminPinDetail("p1")).toBeNull();
  });

  it("maps the creator and engagement counts", async () => {
    db.pin.findUnique.mockResolvedValue({
      id: "p1",
      title: "Pin",
      description: null,
      imageUrl: "/p.png",
      width: 1,
      height: 1,
      link: null,
      createdAt: D,
      downloadCount: 9,
      creator: { id: "u1", name: "Ada" },
      _count: { likes: 2, comments: 1, saves: 4, reports: 0 },
    });
    const detail = await getAdminPinDetail("p1");
    expect(detail).toMatchObject({
      creatorId: "u1",
      creatorName: "Ada",
      counts: { likes: 2, comments: 1, downloads: 9, saves: 4, reports: 0 },
    });
  });
});

describe("getAdminPins", () => {
  it("filters by title/description and maps rows", async () => {
    db.pin.count.mockResolvedValue(1);
    db.pin.findMany.mockResolvedValue([
      {
        id: "p1",
        title: "Pin",
        imageUrl: "/p.png",
        createdAt: D,
        creator: { name: "Ada" },
        _count: { likes: 1, comments: 2 },
      },
    ]);
    const page = await getAdminPins("sun", 2);
    expect(page.rows[0]).toMatchObject({ creatorName: "Ada", likeCount: 1, commentCount: 2 });
    expect(db.pin.findMany.mock.calls[0]?.[0].where.OR).toHaveLength(2);
  });
});

describe("getAdminComments", () => {
  it("maps comment rows with author and pin", async () => {
    db.comment.count.mockResolvedValue(1);
    db.comment.findMany.mockResolvedValue([
      {
        id: "c1",
        body: "hi",
        createdAt: D,
        author: { id: "u1", name: "Ada" },
        pin: { id: "p1", title: "Pin" },
      },
    ]);
    const page = await getAdminComments(1);
    expect(page.rows[0]).toMatchObject({ authorName: "Ada", pinTitle: "Pin" });
  });
});

describe("getAdminReports", () => {
  it("lists pending reports with reporter and pin", async () => {
    db.report.count.mockResolvedValue(1);
    db.report.findMany.mockResolvedValue([
      {
        id: "r1",
        reason: "spam",
        createdAt: D,
        reporter: { name: "Ada", email: "a@x.com" },
        pin: { id: "p1", title: "Pin" },
      },
    ]);
    const page = await getAdminReports(1);
    expect(page.rows[0]).toMatchObject({ reporterEmail: "a@x.com", pinTitle: "Pin" });
  });
});

describe("getAdminOverview", () => {
  it("aggregates headline counts and recent activity", async () => {
    db.user.count.mockResolvedValue(10);
    db.pin.count.mockResolvedValue(20);
    db.comment.count.mockResolvedValue(30);
    db.board.count.mockResolvedValue(5);
    db.report.count.mockResolvedValue(2);
    db.user.findMany.mockResolvedValue([
      { id: "u1", name: "Ada", email: "a@x.com", role: "USER", createdAt: D },
    ]);
    db.pin.findMany.mockResolvedValue([
      { id: "p1", title: "Pin", imageUrl: "/p.png", createdAt: D, creator: { name: "Ada" } },
    ]);
    const overview = await getAdminOverview();
    expect(overview.counts).toEqual({
      users: 10,
      pins: 20,
      comments: 30,
      boards: 5,
      pendingReports: 2,
    });
    expect(overview.recentPins[0]).toMatchObject({ creatorName: "Ada" });
  });
});
