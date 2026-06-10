import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: { block: { findMany: vi.fn() } } }));

import { prisma } from "@/lib/prisma";
import { getBlockState, getHiddenUserIds } from "./blocks";

const db = prisma as unknown as { block: { findMany: Mock } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getHiddenUserIds", () => {
  it("returns an empty list for a signed-out viewer without querying", async () => {
    expect(await getHiddenUserIds(null)).toEqual([]);
    expect(db.block.findMany).not.toHaveBeenCalled();
  });

  it("unions both block directions and dedupes", async () => {
    db.block.findMany.mockResolvedValue([
      { blockerId: "me", blockedId: "a" },
      { blockerId: "b", blockedId: "me" },
      { blockerId: "me", blockedId: "a" },
    ]);
    expect((await getHiddenUserIds("me")).sort()).toEqual(["a", "b"]);
  });
});

describe("getBlockState", () => {
  it("is all-false for a signed-out viewer or the viewer's own id", async () => {
    expect(await getBlockState(null, "u2")).toEqual({
      blockedByViewer: false,
      blocksViewer: false,
    });
    expect(await getBlockState("u1", "u1")).toEqual({
      blockedByViewer: false,
      blocksViewer: false,
    });
    expect(db.block.findMany).not.toHaveBeenCalled();
  });

  it("reports the viewer having blocked the other user", async () => {
    db.block.findMany.mockResolvedValue([{ blockerId: "u1" }]);
    expect(await getBlockState("u1", "u2")).toEqual({ blockedByViewer: true, blocksViewer: false });
  });

  it("reports the other user having blocked the viewer", async () => {
    db.block.findMany.mockResolvedValue([{ blockerId: "u2" }]);
    expect(await getBlockState("u1", "u2")).toEqual({ blockedByViewer: false, blocksViewer: true });
  });
});
