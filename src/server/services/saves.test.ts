import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    save: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getSavedPinIds, getSavedPins, isSaved } from "./saves";

const db = prisma as unknown as {
  save: { findMany: Mock; findUnique: Mock };
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

describe("getSavedPinIds", () => {
  it("returns the saved pin ids", async () => {
    db.save.findMany.mockResolvedValue([{ pinId: "p1" }, { pinId: "p2" }]);
    expect(await getSavedPinIds("u1")).toEqual(["p1", "p2"]);
  });
});

describe("getSavedPins", () => {
  it("maps the saved pins through the relation", async () => {
    db.save.findMany.mockResolvedValue([{ pin: pinRow("p1") }]);
    const pins = await getSavedPins("u1");
    expect(pins[0]?.id).toBe("p1");
  });
});

describe("isSaved", () => {
  it("reflects whether the save row exists", async () => {
    db.save.findUnique.mockResolvedValue({ userId: "u1", pinId: "p1" });
    expect(await isSaved("u1", "p1")).toBe(true);
    db.save.findUnique.mockResolvedValue(null);
    expect(await isSaved("u1", "p1")).toBe(false);
  });
});
