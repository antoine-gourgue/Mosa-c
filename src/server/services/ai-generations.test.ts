import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { aiImageGeneration: { count: vi.fn(), create: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import {
  IMAGE_GENERATION_DAILY_LIMIT,
  imageGenerationsRemaining,
  recordImageGeneration,
} from "./ai-generations";

const db = prisma as unknown as { aiImageGeneration: { count: Mock; create: Mock } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("imageGenerationsRemaining", () => {
  it("counts the user's generations in the last 24 hours", async () => {
    db.aiImageGeneration.count.mockResolvedValue(2);
    expect(await imageGenerationsRemaining("u1")).toBe(IMAGE_GENERATION_DAILY_LIMIT - 2);
    expect(db.aiImageGeneration.count).toHaveBeenCalledWith({
      where: { userId: "u1", createdAt: { gte: expect.any(Date) } },
    });
  });

  it("never goes below zero when the limit is exceeded", async () => {
    db.aiImageGeneration.count.mockResolvedValue(IMAGE_GENERATION_DAILY_LIMIT + 3);
    expect(await imageGenerationsRemaining("u1")).toBe(0);
  });
});

describe("recordImageGeneration", () => {
  it("inserts a generation row for the user", async () => {
    await recordImageGeneration("u1");
    expect(db.aiImageGeneration.create).toHaveBeenCalledWith({ data: { userId: "u1" } });
  });
});
