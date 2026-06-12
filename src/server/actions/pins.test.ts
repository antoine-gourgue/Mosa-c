import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: async (ns: string) => {
    const en = (await import("../../../messages/en.json")).default as unknown as Record<
      string,
      Record<string, string>
    >;
    return (key: string) => en[ns]?.[key] ?? key;
  },
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    pin: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), update: vi.fn() },
    save: { create: vi.fn(), upsert: vi.fn() },
    tag: { upsert: vi.fn() },
    pinTag: { create: vi.fn(), deleteMany: vi.fn() },
    board: { findFirst: vi.fn(), create: vi.fn() },
    boardPin: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ put: vi.fn(async () => ({ url: "/uploads/x.png" })) }),
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createPin, deletePin, updatePin } from "./pins";

const db = prisma as unknown as {
  pin: { create: Mock; findUnique: Mock; delete: Mock; update: Mock };
  save: { create: Mock; upsert: Mock };
  tag: { upsert: Mock };
  pinTag: { create: Mock; deleteMany: Mock };
  board: { findFirst: Mock; create: Mock };
  boardPin: { upsert: Mock };
};

type PlaceData = {
  lat: number | null;
  lng: number | null;
  placeAddress: string | null;
  placeApproximate: boolean;
};

const imageFile = () => new File(["x"], "a.png", { type: "image/png" });

const pinForm = (over: Record<string, string> = {}): FormData => {
  const fd = new FormData();
  fd.set("image", imageFile());
  fd.set("title", "Sunset");
  fd.set("width", "800");
  fd.set("height", "600");
  for (const [k, v] of Object.entries(over)) {
    fd.set(k, v);
  }
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
  db.pin.create.mockResolvedValue({ id: "p1" });
});

describe("createPin", () => {
  it("requires an image", async () => {
    const formData = new FormData();
    formData.set("title", "Hello");
    expect(await createPin(formData)).toEqual({
      ok: false,
      error: expect.stringContaining("image"),
    });
  });

  it("rejects a non-image file", async () => {
    const fd = new FormData();
    fd.set("image", new File(["x"], "a.txt", { type: "text/plain" }));
    expect((await createPin(fd)).ok).toBe(false);
  });

  it("rejects when the user is not signed in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await createPin(new FormData())).ok).toBe(false);
  });

  it("rejects an invalid form (missing title)", async () => {
    const fd = pinForm();
    fd.delete("title");
    expect((await createPin(fd)).ok).toBe(false);
  });

  it("creates the pin with tags into an existing board and redirects", async () => {
    db.board.findFirst.mockResolvedValue({ id: "b1", isDefault: false });
    db.tag.upsert.mockResolvedValue({ id: "t1" });
    await createPin(pinForm({ tags: "Art, Art, Design", board: "Ideas" }));
    expect(db.pin.create).toHaveBeenCalled();
    expect(db.pinTag.create).toHaveBeenCalledTimes(2);
    expect(db.boardPin.upsert).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/boards/b1");
  });

  it("creates a default board and a Save when none matches", async () => {
    db.board.findFirst.mockResolvedValue(null);
    db.board.create.mockResolvedValue({ id: "b0", isDefault: true });
    await createPin(pinForm());
    expect(db.board.create).toHaveBeenCalled();
    expect(db.save.upsert).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/boards/b0");
  });

  it("stores the provided alt text", async () => {
    db.board.findFirst.mockResolvedValue({ id: "b1", isDefault: false });
    await createPin(pinForm({ altText: "A red bike against a wall." }));
    expect(db.pin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ altText: "A red bike against a wall." }),
      }),
    );
  });

  it("attaches a place when a name and coordinates are provided", async () => {
    db.board.findFirst.mockResolvedValue({ id: "b1", isDefault: false });
    await createPin(
      pinForm({
        placeName: "Café de Flore",
        placeAddress: "172 Bd Saint-Germain, Paris",
        lat: "48.854",
        lng: "2.333",
      }),
    );
    expect(db.pin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          placeName: "Café de Flore",
          placeAddress: "172 Bd Saint-Germain, Paris",
          lat: 48.854,
          lng: 2.333,
        }),
      }),
    );
  });

  it("stores a null place when no place fields are provided", async () => {
    db.board.findFirst.mockResolvedValue({ id: "b1", isDefault: false });
    await createPin(pinForm());
    expect(db.pin.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ placeName: null, lat: null, lng: null }),
      }),
    );
  });

  it("drops a place that has coordinates but no name", async () => {
    db.board.findFirst.mockResolvedValue({ id: "b1", isDefault: false });
    await createPin(pinForm({ placeName: "  ", lat: "48.8", lng: "2.3" }));
    expect(db.pin.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ placeName: null, lat: null }) }),
    );
  });

  it("drops a place with out-of-range coordinates", async () => {
    db.board.findFirst.mockResolvedValue({ id: "b1", isDefault: false });
    await createPin(pinForm({ placeName: "Nowhere", lat: "200", lng: "2.3" }));
    expect(db.pin.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ placeName: null, lat: null }) }),
    );
  });

  it("fuzzes the coordinates and drops the address for an approximate place", async () => {
    db.board.findFirst.mockResolvedValue({ id: "b1", isDefault: false });
    await createPin(
      pinForm({
        placeName: "Home",
        placeAddress: "1 Secret Street",
        lat: "48.8000",
        lng: "2.3000",
        placeApproximate: "true",
      }),
    );
    const data = (db.pin.create.mock.calls[0]?.[0] as { data: PlaceData }).data;
    expect(data.placeApproximate).toBe(true);
    expect(data.placeAddress).toBeNull();
    expect(data.lat).not.toBe(48.8);
    expect(Math.abs((data.lat ?? 0) - 48.8)).toBeLessThan(0.02);
    expect(Math.abs((data.lng ?? 0) - 2.3)).toBeLessThan(0.05);
  });
});

describe("deletePin", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await deletePin("p1")).ok).toBe(false);
  });

  it("returns not found for a missing pin", async () => {
    db.pin.findUnique.mockResolvedValue(null);
    expect(await deletePin("p1")).toMatchObject({ ok: false, error: "Pin not found." });
  });

  it("refuses to delete another user's pin", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "other" });
    expect((await deletePin("p1")).ok).toBe(false);
    expect(db.pin.delete).not.toHaveBeenCalled();
  });

  it("deletes the owner's pin", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "u1" });
    expect(await deletePin("p1")).toEqual({ ok: true });
    expect(db.pin.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });
});

describe("updatePin", () => {
  const editForm = (over: Record<string, string> = {}): FormData => {
    const fd = new FormData();
    fd.set("title", "New title");
    fd.set("description", "New description");
    fd.set("link", "");
    fd.set("tags", "");
    for (const [k, v] of Object.entries(over)) {
      fd.set(k, v);
    }
    return fd;
  };

  it("refuses to edit another user's pin", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "other" });
    expect((await updatePin("p1", editForm())).ok).toBe(false);
    expect(db.pin.update).not.toHaveBeenCalled();
  });

  it("rejects an empty title", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "u1" });
    expect((await updatePin("p1", editForm({ title: "   " }))).ok).toBe(false);
    expect(db.pin.update).not.toHaveBeenCalled();
  });

  it("updates the fields and replaces the tags", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "u1" });
    db.tag.upsert.mockResolvedValue({ id: "t1" });
    expect(await updatePin("p1", editForm({ tags: "Travel, Food" }))).toEqual({ ok: true });
    expect(db.pin.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: {
        title: "New title",
        description: "New description",
        link: null,
        placeName: null,
        placeAddress: null,
        lat: null,
        lng: null,
        placeApproximate: false,
      },
    });
    expect(db.pinTag.deleteMany).toHaveBeenCalledWith({ where: { pinId: "p1" } });
    expect(db.pinTag.create).toHaveBeenCalledTimes(2);
  });

  it("updates the pin's place when valid place fields are provided", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "u1" });
    await updatePin(
      "p1",
      editForm({
        placeName: "Café de Flore",
        placeAddress: "172 Bd Saint-Germain, Paris",
        lat: "48.854",
        lng: "2.333",
      }),
    );
    expect(db.pin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          placeName: "Café de Flore",
          placeAddress: "172 Bd Saint-Germain, Paris",
          lat: 48.854,
          lng: 2.333,
        }),
      }),
    );
  });

  it("clears the pin's place when the place fields are blank", async () => {
    db.pin.findUnique.mockResolvedValue({ creatorId: "u1" });
    await updatePin("p1", editForm({ placeName: "", lat: "", lng: "" }));
    expect(db.pin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ placeName: null, lat: null, lng: null }),
      }),
    );
  });

  it("does not re-fuzz an unchanged approximate place on save", async () => {
    db.pin.findUnique.mockResolvedValue({
      creatorId: "u1",
      lat: 10.5,
      lng: 20.5,
      placeApproximate: true,
    });
    await updatePin(
      "p1",
      editForm({ placeName: "Home", lat: "10.5", lng: "20.5", placeApproximate: "true" }),
    );
    const data = (db.pin.update.mock.calls[0]?.[0] as { data: PlaceData }).data;
    expect(data.lat).toBe(10.5);
    expect(data.lng).toBe(20.5);
    expect(data.placeApproximate).toBe(true);
  });

  it("fuzzes a place that just became approximate on save", async () => {
    db.pin.findUnique.mockResolvedValue({
      creatorId: "u1",
      lat: null,
      lng: null,
      placeApproximate: false,
    });
    await updatePin(
      "p1",
      editForm({ placeName: "Home", lat: "10.5", lng: "20.5", placeApproximate: "true" }),
    );
    const data = (db.pin.update.mock.calls[0]?.[0] as { data: PlaceData }).data;
    expect(data.lat).not.toBe(10.5);
    expect(data.placeApproximate).toBe(true);
  });
});
