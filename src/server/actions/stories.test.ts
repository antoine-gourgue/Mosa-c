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
vi.mock("@/server/services", () => ({
  createStory: vi.fn(),
  recordStoryView: vi.fn(),
  toggleStoryLike: vi.fn(),
  deleteStory: vi.fn(),
  getStoryViewers: vi.fn(),
}));

import { getCurrentUser } from "@/lib/auth";
import {
  createStory as createStoryRecord,
  deleteStory as deleteStoryRecord,
  getStoryViewers,
  recordStoryView,
  toggleStoryLike,
} from "@/server/services";
import { createStory, likeStory, listStoryViewers, markStoryViewed, removeStory } from "./stories";

const record = createStoryRecord as unknown as Mock;
const recordView = recordStoryView as unknown as Mock;
const likeRecord = toggleStoryLike as unknown as Mock;
const deleteRecord = deleteStoryRecord as unknown as Mock;
const viewersRecord = getStoryViewers as unknown as Mock;

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

describe("markStoryViewed action", () => {
  it("records the view for a signed-in viewer", async () => {
    await markStoryViewed("s1");
    expect(recordView).toHaveBeenCalledWith("s1", "u1");
  });

  it("is a no-op when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await markStoryViewed("s1");
    expect(recordView).not.toHaveBeenCalled();
  });
});

describe("likeStory action", () => {
  it("delegates to the service for a signed-in viewer", async () => {
    likeRecord.mockResolvedValue({ liked: true, likeCount: 2 });
    expect(await likeStory("s1")).toEqual({ liked: true, likeCount: 2 });
    expect(likeRecord).toHaveBeenCalledWith("s1", "u1");
  });

  it("returns a neutral result when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await likeStory("s1")).toEqual({ liked: false, likeCount: 0 });
    expect(likeRecord).not.toHaveBeenCalled();
  });
});

describe("removeStory action", () => {
  it("deletes for a signed-in owner", async () => {
    deleteRecord.mockResolvedValue(true);
    expect(await removeStory("s1")).toEqual({ ok: true });
    expect(deleteRecord).toHaveBeenCalledWith("s1", "u1");
  });

  it("is rejected when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await removeStory("s1")).toEqual({ ok: false });
    expect(deleteRecord).not.toHaveBeenCalled();
  });
});

describe("listStoryViewers action", () => {
  it("delegates to the service for the author", async () => {
    viewersRecord.mockResolvedValue([]);
    await listStoryViewers("s1");
    expect(viewersRecord).toHaveBeenCalledWith("s1", "u1");
  });

  it("returns an empty list when signed out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await listStoryViewers("s1")).toEqual([]);
    expect(viewersRecord).not.toHaveBeenCalled();
  });
});
