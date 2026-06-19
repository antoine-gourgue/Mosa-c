/**
 * Browser-only video trimming backed by ffmpeg.wasm. The ffmpeg core (~30 MB)
 * is fetched from a CDN and loaded lazily the first time a trim actually runs,
 * then reused. Cutting uses stream copy (`-c copy`), so it is fast and lossless
 * (the start snaps to the nearest keyframe). Like the other DOM/wasm helpers
 * this is excluded from unit coverage and exercised manually / in e2e.
 */

import type { FFmpeg } from "@ffmpeg/ffmpeg";

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

let ffmpegPromise: Promise<FFmpeg> | null = null;

/**
 * Loads (once) and returns the shared ffmpeg.wasm instance.
 *
 * @returns The ready ffmpeg instance.
 */
async function getFfmpeg(): Promise<FFmpeg> {
  if (ffmpegPromise === null) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

/**
 * Trims a video to the segment `[startS, startS + durationS]` without
 * re-encoding, returning a new file in the source container. The output keeps
 * the original MIME type so the rest of the upload pipeline treats it like any
 * selected video.
 *
 * @param file - The source video file.
 * @param startS - Segment start, in seconds.
 * @param durationS - Segment length, in seconds.
 * @returns The trimmed video file.
 */
export async function trimVideo(file: File, startS: number, durationS: number): Promise<File> {
  const ext = file.type === "video/webm" ? "webm" : "mp4";
  const input = `input.${ext}`;
  const output = `output.${ext}`;
  const ffmpeg = await getFfmpeg();
  const { fetchFile } = await import("@ffmpeg/util");
  await ffmpeg.writeFile(input, await fetchFile(file));
  await ffmpeg.exec([
    "-ss",
    startS.toFixed(2),
    "-i",
    input,
    "-t",
    durationS.toFixed(2),
    "-c",
    "copy",
    output,
  ]);
  const data = await ffmpeg.readFile(output);
  await ffmpeg.deleteFile(input);
  await ffmpeg.deleteFile(output);
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const base = file.name.replace(/\.[^./\\]+$/, "") || "clip";
  return new File([bytes as BlobPart], `${base}-trim.${ext}`, {
    type: file.type || "video/mp4",
  });
}
