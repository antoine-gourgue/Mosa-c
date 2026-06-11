import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pin: { findUnique: vi.fn() },
    pinView: { createMany: vi.fn() },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordPinView } from "./analytics";

const db = prisma as unknown as {
  pin: { findUnique: Mock };
  pinView: { createMany: Mock };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({
    id: "viewer",
    name: "Viewer",
    email: "v@x.com",
    image: null,
    role: "USER",
  });
});

describe("recordPinView", () => {
  it("does nothing when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await recordPinView("p1");
    expect(db.pin.findUnique).not.toHaveBeenCalled();
  });

  it("does nothing when the pin is missing", async () => {
    db.pin.findUnique.mockResolvedValue(null);
    await recordPinView("p1");
    expect(db.pinView.createMany).not.toHaveBeenCalled();
  });

  it("does not count the creator's own view", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "viewer" });
    await recordPinView("p1");
    expect(db.pinView.createMany).not.toHaveBeenCalled();
  });

  it("records a deduplicated view bucketed to the UTC day", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "creator" });
    await recordPinView("p1");
    expect(db.pinView.createMany).toHaveBeenCalledOnce();
    const arg = db.pinView.createMany.mock.calls[0]?.[0] as {
      skipDuplicates: boolean;
      data: { pinId: string; viewerId: string; viewedOn: Date }[];
    };
    expect(arg.skipDuplicates).toBe(true);
    const row = arg.data[0];
    expect(row).toMatchObject({ pinId: "p1", viewerId: "viewer" });
    const viewedOn = row?.viewedOn ?? new Date(NaN);
    expect(viewedOn.getUTCHours()).toBe(0);
    expect(viewedOn.getUTCMinutes()).toBe(0);
    expect(viewedOn.getUTCSeconds()).toBe(0);
  });
});
