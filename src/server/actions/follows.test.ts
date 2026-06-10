import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    follow: { findUnique: vi.fn(), create: vi.fn(), createMany: vi.fn(), delete: vi.fn() },
    followRequest: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    notification: { findFirst: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acceptFollowRequest, declineFollowRequest, toggleFollow } from "./follows";

const db = prisma as unknown as {
  follow: { findUnique: Mock; create: Mock; createMany: Mock; delete: Mock };
  followRequest: { findUnique: Mock; create: Mock; delete: Mock; deleteMany: Mock };
  notification: { findFirst: Mock; create: Mock };
  user: { findUnique: Mock };
  $transaction: Mock;
};

describe("toggleFollow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.follow.findUnique.mockResolvedValue(null);
    db.followRequest.findUnique.mockResolvedValue(null);
    db.notification.findFirst.mockResolvedValue(null);
    db.notification.create.mockResolvedValue({ id: "n1" });
    db.user.findUnique.mockResolvedValue({ isPrivate: false });
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      name: "User",
      email: "u@x.com",
      image: null,
      role: "USER",
    });
  });

  it("follows a public creator when not already following", async () => {
    const result = await toggleFollow("creator1");
    expect(db.follow.create).toHaveBeenCalledOnce();
    expect(db.notification.create).toHaveBeenCalledOnce();
    expect(result).toEqual({ status: "following" });
  });

  it("sends a request to a private creator instead of following", async () => {
    db.user.findUnique.mockResolvedValue({ isPrivate: true });
    const result = await toggleFollow("creator1");
    expect(db.followRequest.create).toHaveBeenCalledOnce();
    expect(db.follow.create).not.toHaveBeenCalled();
    expect(db.notification.create).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "requested" });
  });

  it("unfollows when already following", async () => {
    db.follow.findUnique.mockResolvedValue({ followerId: "u1", creatorId: "creator1" });
    const result = await toggleFollow("creator1");
    expect(db.follow.delete).toHaveBeenCalledOnce();
    expect(result).toEqual({ status: "none" });
  });

  it("cancels a pending request when one exists", async () => {
    db.followRequest.findUnique.mockResolvedValue({ requesterId: "u1", targetId: "creator1" });
    const result = await toggleFollow("creator1");
    expect(db.followRequest.delete).toHaveBeenCalledOnce();
    expect(db.follow.create).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "none" });
  });

  it("rejects following yourself", async () => {
    await expect(toggleFollow("u1")).rejects.toThrow();
    expect(db.follow.create).not.toHaveBeenCalled();
  });

  it("throws when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(toggleFollow("creator1")).rejects.toThrow();
  });
});

describe("acceptFollowRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      name: "User",
      email: "u@x.com",
      image: null,
      role: "USER",
    });
  });

  it("creates the follow and clears the request when one exists", async () => {
    db.followRequest.findUnique.mockResolvedValue({ requesterId: "r1" });
    await acceptFollowRequest("r1");
    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  it("no-ops when the request no longer exists", async () => {
    db.followRequest.findUnique.mockResolvedValue(null);
    await acceptFollowRequest("r1");
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("throws when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(acceptFollowRequest("r1")).rejects.toThrow();
  });
});

describe("declineFollowRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      name: "User",
      email: "u@x.com",
      image: null,
      role: "USER",
    });
  });

  it("deletes the pending request", async () => {
    await declineFollowRequest("r1");
    expect(db.followRequest.deleteMany).toHaveBeenCalledWith({
      where: { requesterId: "r1", targetId: "u1" },
    });
  });

  it("throws when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(declineFollowRequest("r1")).rejects.toThrow();
  });
});
