/**
 * A compressed image ready for upload, with its final pixel dimensions.
 */
export type CompressedImage = {
  file: File;
  width: number;
  height: number;
};

/**
 * Replaces a filename's extension with `.webp`.
 *
 * @param name - The original filename.
 * @returns The filename with a `.webp` extension.
 */
function toWebpName(name: string): string {
  const base = name.replace(/\.[^./\\]+$/, "");
  return `${base || "image"}.webp`;
}

/**
 * Whether a file is an Apple HEIC/HEIF image, detected by MIME type or by
 * extension since iOS sometimes reports an empty type for these files.
 *
 * @param file - The selected file.
 * @returns True when the file is HEIC or HEIF.
 */
export function isHeicFile(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/**
 * Ensures a file can be decoded by the browser. HEIC/HEIF images (typically
 * iPhone photos) are converted to JPEG because `createImageBitmap` and `<img>`
 * cannot decode them reliably outside Safari; every other file is returned
 * unchanged. The HEIC decoder is imported on demand so it never weighs on the
 * initial bundle.
 *
 * @param file - The selected file.
 * @returns A browser-decodable image file.
 */
export async function ensureDisplayableImage(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }
  const { heicTo } = await import("heic-to");
  const blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
  const base = file.name.replace(/\.[^./\\]+$/, "") || "image";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

/**
 * Compresses an image in the browser before upload: it is downscaled so its
 * longest edge is at most `maxEdge` and re-encoded as WebP at the given quality.
 * Animated GIFs and non-raster images are returned unchanged, and the original
 * is kept whenever compression would not make it smaller.
 *
 * @param file - The selected image file.
 * @param maxEdge - The maximum width or height in pixels.
 * @param quality - The WebP quality between 0 and 1.
 * @returns The compressed file and its dimensions.
 */
export async function compressImage(
  file: File,
  maxEdge = 2000,
  quality = 0.85,
): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const { width: sourceWidth, height: sourceHeight } = bitmap;

  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    bitmap.close();
    return { file, width: sourceWidth, height: sourceHeight };
  }

  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context === null) {
    bitmap.close();
    return { file, width: sourceWidth, height: sourceHeight };
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });

  if (blob === null || blob.size >= file.size) {
    return { file, width: sourceWidth, height: sourceHeight };
  }
  return {
    file: new File([blob], toWebpName(file.name), { type: "image/webp" }),
    width,
    height,
  };
}
