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
