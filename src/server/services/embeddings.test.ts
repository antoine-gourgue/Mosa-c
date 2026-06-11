import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai", () => ({
  aiAvailable: vi.fn(),
  describeImage: vi.fn(),
  embed: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pin: { findUnique: vi.fn(), update: vi.fn() },
    pinEmbedding: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn() },
  },
}));

import { aiAvailable, describeImage, embed } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { embedPin, embedQuery, findSimilarPinIds, getPinVector } from "./embeddings";

const db = prisma as unknown as {
  pin: { findUnique: Mock; update: Mock };
  pinEmbedding: { findUnique: Mock; findMany: Mock; upsert: Mock };
};

const pinRow = (over: Record<string, unknown> = {}) => ({
  title: "Sunset bike",
  description: null,
  altText: "A red bike at sunset.",
  imageUrl: "/p.png",
  tags: [{ tag: { name: "bike" } }],
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(aiAvailable).mockReturnValue(true);
});

describe("embedPin", () => {
  it("no-ops when AI is unavailable", async () => {
    vi.mocked(aiAvailable).mockReturnValue(false);
    expect(await embedPin("p1")).toBe(false);
    expect(db.pin.findUnique).not.toHaveBeenCalled();
  });

  it("embeds the pin text and stores the vector", async () => {
    db.pin.findUnique.mockResolvedValue(pinRow());
    vi.mocked(embed).mockResolvedValue([0.1, 0.2]);
    expect(await embedPin("p1")).toBe(true);
    expect(describeImage).not.toHaveBeenCalled();
    expect(db.pinEmbedding.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pinId: "p1" },
        create: { pinId: "p1", vector: [0.1, 0.2] },
      }),
    );
  });

  it("describes the image first when alt text is missing (backfill)", async () => {
    db.pin.findUnique.mockResolvedValue(pinRow({ altText: null }));
    vi.mocked(describeImage).mockResolvedValue("A described bike.");
    vi.mocked(embed).mockResolvedValue([0.3]);
    expect(await embedPin("p1", { describeIfNeeded: true })).toBe(true);
    expect(describeImage).toHaveBeenCalledWith("/p.png");
    expect(db.pin.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { altText: "A described bike." },
    });
  });

  it("returns false when the embedding call fails", async () => {
    db.pin.findUnique.mockResolvedValue(pinRow());
    vi.mocked(embed).mockResolvedValue(null);
    expect(await embedPin("p1")).toBe(false);
    expect(db.pinEmbedding.upsert).not.toHaveBeenCalled();
  });

  it("returns false when the pin no longer exists", async () => {
    db.pin.findUnique.mockResolvedValue(null);
    expect(await embedPin("p1")).toBe(false);
    expect(embed).not.toHaveBeenCalled();
  });

  it("returns false when there is no text to embed", async () => {
    db.pin.findUnique.mockResolvedValue(
      pinRow({ title: "", description: null, altText: null, tags: [] }),
    );
    expect(await embedPin("p1")).toBe(false);
    expect(embed).not.toHaveBeenCalled();
  });
});

describe("getPinVector / embedQuery", () => {
  it("returns the stored vector or null", async () => {
    db.pinEmbedding.findUnique.mockResolvedValue({ vector: [1, 2] });
    expect(await getPinVector("p1")).toEqual([1, 2]);
    db.pinEmbedding.findUnique.mockResolvedValue(null);
    expect(await getPinVector("p1")).toBeNull();
  });

  it("embeds a query only when AI is available", async () => {
    vi.mocked(aiAvailable).mockReturnValue(false);
    expect(await embedQuery("bikes")).toBeNull();
    vi.mocked(aiAvailable).mockReturnValue(true);
    vi.mocked(embed).mockResolvedValue([0.5]);
    expect(await embedQuery("bikes")).toEqual([0.5]);
  });
});

describe("findSimilarPinIds", () => {
  it("ranks candidates by cosine similarity and applies the limit", async () => {
    db.pinEmbedding.findMany.mockResolvedValue([
      { pinId: "far", vector: [0, 1] },
      { pinId: "near", vector: [1, 0.1] },
      { pinId: "mid", vector: [1, 1] },
    ]);
    const result = await findSimilarPinIds([1, 0], { excludeUserIds: [], limit: 2 });
    expect(result).toEqual(["near", "mid"]);
  });

  it("excludes a pin and hidden creators in the query", async () => {
    db.pinEmbedding.findMany.mockResolvedValue([]);
    await findSimilarPinIds([1, 0], { excludePinId: "p1", excludeUserIds: ["u9"], limit: 5 });
    expect(db.pinEmbedding.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pinId: { not: "p1" }, pin: { creatorId: { notIn: ["u9"] } } },
      }),
    );
  });
});
