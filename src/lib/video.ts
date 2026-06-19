/**
 * Browser-only helpers for video pins: validating an uploaded clip and
 * extracting a poster frame from it. Like {@link "./image"}, this leans on the
 * DOM (a `<video>` element and a canvas) and is therefore excluded from unit
 * coverage and exercised through the e2e suite instead.
 */

/** Largest accepted video upload, in bytes (50 MB). */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

/** Longest accepted video, in seconds. */
export const MAX_VIDEO_SECONDS = 60;

/** Video MIME types the create flow accepts and can preview in-browser. */
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

/**
 * A poster frame grabbed from a video, with the clip's intrinsic size and
 * rounded duration, ready to publish as the pin's thumbnail.
 */
export type VideoPoster = {
  poster: File;
  width: number;
  height: number;
  durationS: number;
};

/**
 * Whether a file is a video the create flow accepts.
 *
 * @param file - The candidate file.
 * @returns True for an accepted video MIME type.
 */
export function isAcceptedVideo(file: File): boolean {
  return (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type);
}

/**
 * Loads a video file off-screen, seeks just past the start, and captures the
 * first visible frame as a JPEG poster — also reporting the clip's intrinsic
 * dimensions and duration. Rejects if the video cannot be decoded or a frame
 * cannot be drawn.
 *
 * @param file - The source video file.
 * @returns The poster file with the video's size and duration.
 */
export function extractVideoPoster(file: File): Promise<VideoPoster> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;

    let measured = 0;
    let phase: "measure" | "poster" = "poster";

    const cleanup = (): void => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };
    const fail = (): void => {
      cleanup();
      reject(new Error("video-decode-failed"));
    };

    const seekToPoster = (): void => {
      phase = "poster";
      video.currentTime = Math.min(0.1, measured / 2) || 0;
    };

    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        measured = video.duration;
        seekToPoster();
      } else {
        phase = "measure";
        video.currentTime = 1e7;
      }
    };

    video.onseeked = () => {
      if (phase === "measure") {
        measured = Number.isFinite(video.duration) ? video.duration : video.currentTime;
        seekToPoster();
        return;
      }
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (width === 0 || height === 0) {
        fail();
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (context === null) {
        fail();
        return;
      }
      context.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob === null) {
            fail();
            return;
          }
          const base = file.name.replace(/\.[^./\\]+$/, "") || "video";
          const poster = new File([blob], `${base}-poster.jpg`, { type: "image/jpeg" });
          cleanup();
          resolve({
            poster,
            width,
            height,
            durationS: Math.max(1, Math.round(measured)),
          });
        },
        "image/jpeg",
        0.85,
      );
    };

    video.onerror = fail;
  });
}
