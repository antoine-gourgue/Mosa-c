import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/ai", () => ({
  aiAvailable: vi.fn(),
  describeImage: vi.fn(),
  suggestTags: vi.fn(),
  generateImage: vi.fn(),
}));
vi.mock("@/server/error-message", () => ({ errorMessage: async (key: string) => key }));
vi.mock("@/server/services", () => ({
  imageGenerationsRemaining: vi.fn(),
  recordImageGeneration: vi.fn(),
}));

import { aiAvailable, describeImage, generateImage, suggestTags } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { imageGenerationsRemaining, recordImageGeneration } from "@/server/services";
import { analyzePinImage, generatePinImage } from "./ai";

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

describe("generatePinImage", () => {
  beforeEach(() => {
    vi.mocked(imageGenerationsRemaining).mockResolvedValue(5);
    vi.mocked(generateImage).mockResolvedValue({
      dataUrl: "data:image/png;base64,AAAA",
      width: 768,
      height: 1024,
    });
  });

  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await generatePinImage("a cat")).ok).toBe(false);
  });

  it("rejects a blank prompt without generating", async () => {
    expect((await generatePinImage("   ")).ok).toBe(false);
    expect(generateImage).not.toHaveBeenCalled();
  });

  it("rejects when the daily limit is reached and does not generate", async () => {
    vi.mocked(imageGenerationsRemaining).mockResolvedValue(0);
    expect((await generatePinImage("a cat")).ok).toBe(false);
    expect(generateImage).not.toHaveBeenCalled();
  });

  it("does not record a generation when generation fails", async () => {
    vi.mocked(generateImage).mockResolvedValue(null);
    expect((await generatePinImage("a cat")).ok).toBe(false);
    expect(recordImageGeneration).not.toHaveBeenCalled();
  });

  it("generates, records and returns the image with the remaining count", async () => {
    const result = await generatePinImage("a misty lake");
    expect(result).toEqual({
      ok: true,
      dataUrl: "data:image/png;base64,AAAA",
      width: 768,
      height: 1024,
      remaining: 4,
    });
    expect(recordImageGeneration).toHaveBeenCalledWith("u1");
  });
});
