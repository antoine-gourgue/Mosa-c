import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { report: { upsert: vi.fn() } } }));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportComment, reportPin, reportUser } from "./reports";

const db = prisma as unknown as { report: { upsert: Mock } };

const signedIn = (): void => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "u1",
    name: "U",
    email: "u@x.com",
    image: null,
    role: "USER",
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  signedIn();
});

describe("reportPin", () => {
  it("rejects anonymous reporters", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(reportPin("pin1")).rejects.toThrow();
    expect(db.report.upsert).not.toHaveBeenCalled();
  });

  it("records a pending pin report keyed by pin and reporter", async () => {
    await reportPin("pin1", "spam");
    expect(db.report.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pinId_reporterId: { pinId: "pin1", reporterId: "u1" } },
        create: { targetType: "PIN", pinId: "pin1", reporterId: "u1", reason: "spam" },
      }),
    );
  });
});

describe("reportComment", () => {
  it("records a pending comment report keyed by comment and reporter", async () => {
    await reportComment("c1");
    expect(db.report.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { commentId_reporterId: { commentId: "c1", reporterId: "u1" } },
        create: { targetType: "COMMENT", commentId: "c1", reporterId: "u1", reason: null },
      }),
    );
  });
});

describe("reportUser", () => {
  it("refuses self-reports", async () => {
    await expect(reportUser("u1")).rejects.toThrow();
    expect(db.report.upsert).not.toHaveBeenCalled();
  });

  it("records a pending user report keyed by target user and reporter", async () => {
    await reportUser("u9", "harassment");
    expect(db.report.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { targetUserId_reporterId: { targetUserId: "u9", reporterId: "u1" } },
        create: { targetType: "USER", targetUserId: "u9", reporterId: "u1", reason: "harassment" },
      }),
    );
  });
});
