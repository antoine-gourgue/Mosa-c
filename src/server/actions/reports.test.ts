import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { report: { upsert: vi.fn() } } }));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportPin } from "./reports";

const db = prisma as unknown as { report: { upsert: Mock } };

describe("reportPin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects anonymous reporters", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(reportPin("pin1")).rejects.toThrow();
    expect(db.report.upsert).not.toHaveBeenCalled();
  });

  it("records a pending report keyed by pin and reporter", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "u1",
      name: "U",
      email: "u@x.com",
      image: null,
      role: "USER",
    });
    await reportPin("pin1", "spam");
    expect(db.report.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pinId_reporterId: { pinId: "pin1", reporterId: "u1" } },
      }),
    );
  });
});
