import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/services", () => ({
  getHighlights: vi.fn(),
  getHighlightDetail: vi.fn(),
  getAddableStories: vi.fn(),
  createHighlight: vi.fn(),
  addStoryToHighlight: vi.fn(),
  removeStoryFromHighlight: vi.fn(),
  renameHighlight: vi.fn(),
  deleteHighlight: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth";
import {
  addStoryToHighlight,
  createHighlight,
  deleteHighlight,
  getAddableStories,
  getHighlightDetail,
  getHighlights,
  removeStoryFromHighlight,
  renameHighlight,
} from "@/server/services";
import {
  addableStories,
  addToHighlight,
  createStoryHighlight,
  loadHighlight,
  myHighlights,
  removeFromHighlight,
  removeHighlight,
  renameStoryHighlight,
} from "./highlights";

const auth = getCurrentUser as unknown as Mock;
const create = createHighlight as unknown as Mock;
const add = addStoryToHighlight as unknown as Mock;
const del = deleteHighlight as unknown as Mock;
const list = getHighlights as unknown as Mock;
const detail = getHighlightDetail as unknown as Mock;
const addable = getAddableStories as unknown as Mock;
const removeStory = removeStoryFromHighlight as unknown as Mock;
const rename = renameHighlight as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ id: "u1" });
});

describe("myHighlights", () => {
  it("returns an empty list when signed out", async () => {
    auth.mockResolvedValue(null);
    expect(await myHighlights()).toEqual([]);
    expect(list).not.toHaveBeenCalled();
  });

  it("delegates for a signed-in user", async () => {
    list.mockResolvedValue([]);
    await myHighlights();
    expect(list).toHaveBeenCalledWith("u1");
  });
});

describe("createStoryHighlight", () => {
  it("creates and reports the id", async () => {
    create.mockResolvedValue("h1");
    expect(await createStoryHighlight("s1", "Trips")).toEqual({ ok: true, id: "h1" });
    expect(create).toHaveBeenCalledWith("u1", "Trips", "s1");
  });

  it("is rejected when signed out", async () => {
    auth.mockResolvedValue(null);
    expect(await createStoryHighlight("s1", "Trips")).toEqual({ ok: false, id: null });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("loadHighlight", () => {
  it("loads with the viewer id when signed in", async () => {
    detail.mockResolvedValue({ id: "h1" });
    expect(await loadHighlight("h1")).toEqual({ id: "h1" });
    expect(detail).toHaveBeenCalledWith("h1", "u1");
  });

  it("loads with an empty viewer id when signed out", async () => {
    auth.mockResolvedValue(null);
    detail.mockResolvedValue(null);
    expect(await loadHighlight("h1")).toBeNull();
    expect(detail).toHaveBeenCalledWith("h1", "");
  });
});

describe("addableStories", () => {
  it("delegates for a signed-in user", async () => {
    addable.mockResolvedValue([{ id: "s1" }]);
    expect(await addableStories("h1")).toEqual([{ id: "s1" }]);
    expect(addable).toHaveBeenCalledWith("h1", "u1");
  });

  it("returns an empty list when signed out", async () => {
    auth.mockResolvedValue(null);
    expect(await addableStories("h1")).toEqual([]);
    expect(addable).not.toHaveBeenCalled();
  });
});

describe("addToHighlight / removeHighlight", () => {
  it("adds a story for the owner", async () => {
    add.mockResolvedValue(true);
    expect(await addToHighlight("h1", "s1")).toEqual({ ok: true });
    expect(add).toHaveBeenCalledWith("h1", "s1", "u1");
  });

  it("rejects adding when signed out", async () => {
    auth.mockResolvedValue(null);
    expect(await addToHighlight("h1", "s1")).toEqual({ ok: false });
    expect(add).not.toHaveBeenCalled();
  });

  it("deletes a highlight for the owner", async () => {
    del.mockResolvedValue(true);
    expect(await removeHighlight("h1")).toEqual({ ok: true });
    expect(del).toHaveBeenCalledWith("h1", "u1");
  });

  it("rejects deleting when signed out", async () => {
    auth.mockResolvedValue(null);
    expect(await removeHighlight("h1")).toEqual({ ok: false });
    expect(del).not.toHaveBeenCalled();
  });
});

describe("removeFromHighlight / renameStoryHighlight", () => {
  it("removes a story for the owner", async () => {
    removeStory.mockResolvedValue(true);
    expect(await removeFromHighlight("h1", "s1")).toEqual({ ok: true });
    expect(removeStory).toHaveBeenCalledWith("h1", "s1", "u1");
  });

  it("rejects removing a story when signed out", async () => {
    auth.mockResolvedValue(null);
    expect(await removeFromHighlight("h1", "s1")).toEqual({ ok: false });
    expect(removeStory).not.toHaveBeenCalled();
  });

  it("renames for the owner", async () => {
    rename.mockResolvedValue(true);
    expect(await renameStoryHighlight("h1", "Trips")).toEqual({ ok: true });
    expect(rename).toHaveBeenCalledWith("h1", "u1", "Trips");
  });

  it("rejects renaming when signed out", async () => {
    auth.mockResolvedValue(null);
    expect(await renameStoryHighlight("h1", "Trips")).toEqual({ ok: false });
    expect(rename).not.toHaveBeenCalled();
  });
});
