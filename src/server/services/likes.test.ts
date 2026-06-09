import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    like: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getLikedPinIds, getLikedPins, getLikeState } from "./likes";

const db = prisma as unknown as {
  like: { findMany: Mock; findUnique: Mock; count: Mock };
};

const pinRow = (id: string) => ({
  id,
  title: id,
  description: null,
  imageUrl: "/p.png",
  width: 1,
  height: 1,
  link: null,
  downloadCount: 0,
  creator: {
    id: "u1",
    name: "Ada",
    username: null,
    bio: null,
    avatarUrl: null,
    followersLabel: null,
    verified: false,
  },
  tags: [],
  _count: { likes: 0, comments: 0 },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getLikedPinIds", () => {
  it("returns the liked pin ids", async () => {
    db.like.findMany.mockResolvedValue([{ pinId: "p1" }]);
    expect(await getLikedPinIds("u1")).toEqual(["p1"]);
  });
});

describe("getLikedPins", () => {
  it("maps the liked pins through the relation", async () => {
    db.like.findMany.mockResolvedValue([{ pin: pinRow("p1") }]);
    expect((await getLikedPins("u1"))[0]?.id).toBe("p1");
  });
});

describe("getLikeState", () => {
  it("reports the count and a signed-out viewer as not liked", async () => {
    db.like.count.mockResolvedValue(5);
    expect(await getLikeState("p1", null)).toEqual({ count: 5, liked: false });
    expect(db.like.findUnique).not.toHaveBeenCalled();
  });

  it("reports a signed-in viewer's liked state", async () => {
    db.like.count.mockResolvedValue(5);
    db.like.findUnique.mockResolvedValue({ userId: "u1", pinId: "p1" });
    expect(await getLikeState("p1", "u1")).toEqual({ count: 5, liked: true });
  });

  it("reports not-liked when the viewer has no like row", async () => {
    db.like.count.mockResolvedValue(0);
    db.like.findUnique.mockResolvedValue(null);
    expect(await getLikeState("p1", "u1")).toEqual({ count: 0, liked: false });
  });
});
