import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ put: vi.fn(async () => ({ url: "/uploads/x.png" })) }),
}));
vi.mock("@/server/services", () => ({ createStory: vi.fn() }));

import { getCurrentUser } from "@/lib/auth";
import { createStory as createStoryRecord } from "@/server/services";
import { createStory } from "./stories";

const record = createStoryRecord as unknown as Mock;

const imageFile = () => new File(["x"], "a.png", { type: "image/png" });

const storyForm = (over: Record<string, string> = {}): FormData => {
  const fd = new FormData();
  fd.set("image", imageFile());
  fd.set("width", "720");
  fd.set("height", "1280");
  for (const [key, value] of Object.entries(over)) {
    fd.set(key, value);
  }
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue({ id: "u1" } as never);
});

describe("createStory action", () => {
  it("rejects when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await createStory(new FormData())).ok).toBe(false);
    expect(record).not.toHaveBeenCalled();
  });

  it("requires an image poster", async () => {
    const fd = new FormData();
    fd.set("width", "720");
    fd.set("height", "1280");
    expect((await createStory(fd)).ok).toBe(false);
  });

  it("rejects a non-image poster", async () => {
    const fd = storyForm();
    fd.set("image", new File(["x"], "a.txt", { type: "text/plain" }));
    expect((await createStory(fd)).ok).toBe(false);
  });

  it("posts an image story", async () => {
    await createStory(storyForm());
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: "u1",
        mediaType: "IMAGE",
        imageUrl: "/uploads/x.png",
        videoUrl: null,
      }),
    );
  });

  it("posts a video story with the stored video and duration", async () => {
    const fd = storyForm({ mediaType: "VIDEO", videoDurationS: "12" });
    fd.set("video", new File(["v"], "clip.mp4", { type: "video/mp4" }));
    await createStory(fd);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaType: "VIDEO",
        videoUrl: "/uploads/x.png",
        videoDurationS: 12,
      }),
    );
  });

  it("rejects a video story without a valid video file", async () => {
    const result = await createStory(storyForm({ mediaType: "VIDEO" }));
    expect(result.ok).toBe(false);
    expect(record).not.toHaveBeenCalled();
  });

  it("rejects a video over the size limit", async () => {
    const fd = storyForm({ mediaType: "VIDEO" });
    const big = new File(["v"], "clip.mp4", { type: "video/mp4" });
    Object.defineProperty(big, "size", { value: 50 * 1024 * 1024 + 1 });
    fd.set("video", big);
    expect((await createStory(fd)).ok).toBe(false);
    expect(record).not.toHaveBeenCalled();
  });

  it("rejects a video longer than the limit", async () => {
    const fd = storyForm({ mediaType: "VIDEO", videoDurationS: "61" });
    fd.set("video", new File(["v"], "clip.mp4", { type: "video/mp4" }));
    expect((await createStory(fd)).ok).toBe(false);
    expect(record).not.toHaveBeenCalled();
  });
});
