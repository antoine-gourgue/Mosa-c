import { describe, expect, it } from "vitest";
import type { BoardRow, CreatorRow, PinRow, TagRow } from "./mappers";
import { toBoard, toCreator, toPin, toTag } from "./mappers";

const creatorRow: CreatorRow = {
  id: "u1",
  name: "Ada",
  username: "ada",
  bio: "builder",
  avatarUrl: "/a.png",
  followersLabel: "1.2k",
  verified: true,
  isPrivate: true,
};

describe("toCreator", () => {
  it("maps every field through unchanged", () => {
    expect(toCreator(creatorRow)).toEqual({
      id: "u1",
      name: "Ada",
      username: "ada",
      bio: "builder",
      avatarUrl: "/a.png",
      followersLabel: "1.2k",
      verified: true,
      isPrivate: true,
    });
  });

  it("preserves nulls", () => {
    const row: CreatorRow = {
      ...creatorRow,
      username: null,
      bio: null,
      avatarUrl: null,
      followersLabel: null,
      verified: false,
    };
    const mapped = toCreator(row);
    expect(mapped.username).toBeNull();
    expect(mapped.avatarUrl).toBeNull();
    expect(mapped.verified).toBe(false);
  });
});

describe("toTag", () => {
  it("keeps only id, slug and name", () => {
    const row: TagRow = { id: "t1", slug: "art", name: "Art" };
    expect(toTag(row)).toEqual({ id: "t1", slug: "art", name: "Art" });
  });
});

describe("toPin", () => {
  const pinRow: PinRow = {
    id: "p1",
    title: "Sunset",
    description: null,
    altText: null,
    imageUrl: "/p.png",
    width: 800,
    height: 600,
    link: "https://example.com",
    placeName: null,
    placeAddress: null,
    lat: null,
    lng: null,
    downloadCount: 7,
    creator: creatorRow,
    tags: [{ tag: { id: "t1", slug: "art", name: "Art" } }],
    _count: { likes: 3, comments: 2 },
  };

  it("maps relations and projects the counts", () => {
    const pin = toPin(pinRow);
    expect(pin.creator.id).toBe("u1");
    expect(pin.tags).toEqual([{ id: "t1", slug: "art", name: "Art" }]);
    expect(pin.likeCount).toBe(3);
    expect(pin.commentCount).toBe(2);
    expect(pin.downloadCount).toBe(7);
  });

  it("handles a pin with no tags", () => {
    expect(toPin({ ...pinRow, tags: [] }).tags).toEqual([]);
  });

  it("leaves place null when the pin has no coordinates", () => {
    expect(toPin(pinRow).place).toBeNull();
  });

  it("maps a place when name and coordinates are present", () => {
    const pin = toPin({
      ...pinRow,
      placeName: "Café de Flore",
      placeAddress: "172 Bd Saint-Germain, Paris",
      lat: 48.854,
      lng: 2.333,
    });
    expect(pin.place).toEqual({
      name: "Café de Flore",
      address: "172 Bd Saint-Germain, Paris",
      lat: 48.854,
      lng: 2.333,
    });
  });

  it("treats a place with a name but missing coordinates as no place", () => {
    expect(toPin({ ...pinRow, placeName: "Somewhere", lat: null, lng: null }).place).toBeNull();
  });
});

describe("toBoard", () => {
  it("projects the pin count", () => {
    const row: BoardRow = {
      id: "b1",
      name: "Ideas",
      description: null,
      visibility: "PUBLIC",
      isDefault: true,
      _count: { pins: 9 },
    };
    expect(toBoard(row)).toEqual({
      id: "b1",
      name: "Ideas",
      description: null,
      visibility: "PUBLIC",
      isDefault: true,
      pinCount: 9,
    });
  });
});
