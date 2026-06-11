import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pin: { findMany: vi.fn() },
    pinView: { groupBy: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { getCreatorAnalytics } from "./analytics";

const db = prisma as unknown as {
  pin: { findMany: Mock };
  pinView: { groupBy: Mock };
};

function utcDay(date: Date): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  ).toISOString();
}

beforeEach(() => {
  vi.clearAllMocks();
  db.pinView.groupBy.mockResolvedValue([]);
});

describe("getCreatorAnalytics", () => {
  it("returns zeroed totals and a 30-day trend for a creator with no pins", async () => {
    db.pin.findMany.mockResolvedValue([]);
    const result = await getCreatorAnalytics("u1");
    expect(result.totals).toEqual({ views: 0, saves: 0, likes: 0, downloads: 0, pins: 0 });
    expect(result.pins).toEqual([]);
    expect(result.trend).toHaveLength(30);
    expect(result.trend.every((day) => day.views === 0)).toBe(true);
  });

  it("aggregates per-pin engagement, totals and ranks pins by views", async () => {
    db.pin.findMany.mockResolvedValue([
      {
        id: "p1",
        title: "Low",
        imageUrl: "/p1.png",
        downloadCount: 2,
        _count: { saves: 1, likes: 3 },
      },
      {
        id: "p2",
        title: "High",
        imageUrl: "/p2.png",
        downloadCount: 5,
        _count: { saves: 4, likes: 1 },
      },
    ]);
    db.pinView.groupBy.mockImplementation((args: { by: string[] }) =>
      args.by[0] === "pinId"
        ? Promise.resolve([
            { pinId: "p1", _count: { _all: 10 } },
            { pinId: "p2", _count: { _all: 40 } },
          ])
        : Promise.resolve([]),
    );

    const result = await getCreatorAnalytics("u1");

    expect(result.pins.map((pin) => pin.id)).toEqual(["p2", "p1"]);
    expect(result.pins[0]).toMatchObject({ id: "p2", views: 40, saves: 4, likes: 1, downloads: 5 });
    expect(result.totals).toEqual({ views: 50, saves: 5, likes: 4, downloads: 7, pins: 2 });
  });

  it("places daily view counts on the right day of the trend", async () => {
    const today = utcDay(new Date());
    db.pin.findMany.mockResolvedValue([
      {
        id: "p1",
        title: "P",
        imageUrl: "/p.png",
        downloadCount: 0,
        _count: { saves: 0, likes: 0 },
      },
    ]);
    db.pinView.groupBy.mockImplementation((args: { by: string[] }) =>
      args.by[0] === "viewedOn"
        ? Promise.resolve([{ viewedOn: new Date(today), _count: { _all: 7 } }])
        : Promise.resolve([]),
    );

    const result = await getCreatorAnalytics("u1");
    expect(result.trend).toHaveLength(30);
    expect(result.trend[29]).toEqual({ day: today.slice(0, 10), views: 7 });
    expect(result.trend[0]?.views).toBe(0);
  });
});
