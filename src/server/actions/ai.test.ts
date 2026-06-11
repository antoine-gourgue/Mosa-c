import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/ai", () => ({
  aiAvailable: vi.fn(),
  describeImage: vi.fn(),
  suggestTags: vi.fn(),
}));

import { aiAvailable, describeImage, suggestTags } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { analyzePinImage } from "./ai";

const imageForm = (): FormData => {
  const fd = new FormData();
  fd.set("image", new File(["x"], "a.png", { type: "image/png" }));
  fd.set("title", "My ride");
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
  vi.mocked(aiAvailable).mockReturnValue(true);
  vi.mocked(describeImage).mockResolvedValue("A red bike.");
  vi.mocked(suggestTags).mockResolvedValue(["bike", "urban"]);
});

describe("analyzePinImage", () => {
  it("returns empty results when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await analyzePinImage(imageForm())).toEqual({ altText: null, tags: [] });
    expect(describeImage).not.toHaveBeenCalled();
  });

  it("returns empty results when AI is unavailable", async () => {
    vi.mocked(aiAvailable).mockReturnValue(false);
    expect(await analyzePinImage(imageForm())).toEqual({ altText: null, tags: [] });
    expect(suggestTags).not.toHaveBeenCalled();
  });

  it("returns empty results when there is no valid image", async () => {
    const fd = new FormData();
    fd.set("image", new File(["x"], "a.txt", { type: "text/plain" }));
    expect(await analyzePinImage(fd)).toEqual({ altText: null, tags: [] });
    expect(describeImage).not.toHaveBeenCalled();
  });

  it("describes and tags the image, passing a data URI and the title", async () => {
    const result = await analyzePinImage(imageForm());
    expect(result).toEqual({ altText: "A red bike.", tags: ["bike", "urban"] });
    expect(describeImage).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/png;base64,/));
    expect(suggestTags).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "My ride",
        imageUrl: expect.stringMatching(/^data:image\/png;base64,/),
      }),
    );
  });
});
