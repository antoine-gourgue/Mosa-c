import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { pin: { update: vi.fn() } } }));

import { prisma } from "@/lib/prisma";
import { recordDownload } from "./downloads";

const db = prisma as unknown as { pin: { update: Mock } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordDownload", () => {
  it("increments and returns the download count", async () => {
    db.pin.update.mockResolvedValue({ downloadCount: 12 });
    expect(await recordDownload("p1")).toEqual({ count: 12 });
    expect(db.pin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p1" },
        data: { downloadCount: { increment: 1 } },
      }),
    );
  });
});
