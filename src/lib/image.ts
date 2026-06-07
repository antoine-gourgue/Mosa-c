/**
 * A compressed image ready for upload, with its final pixel dimensions.
 */
export type CompressedImage = {
  file: File;
  width: number;
  height: number;
};

/**
 * Replaces a filename's extension with the one matching an image MIME type.
 *
 * @param name - The original filename.
 * @param type - The output MIME type.
 * @returns The filename with the matching extension.
 */
function renameForType(name: string, type: string): string {
  const base = name.replace(/\.[^./\\]+$/, "") || "image";
  return `${base}.${type === "image/webp" ? "webp" : "jpg"}`;
}

/**
 * A decoded image ready to be drawn onto a canvas, with its intrinsic size and
 * a release callback to free its resources.
 */
type DecodedImage = {
  width: number;
  height: number;
  drawTo: (context: CanvasRenderingContext2D, width: number, height: number) => void;
  release: () => void;
};

/**
 * Decodes an image file for canvas drawing. Prefers `createImageBitmap` and
 * falls back to an `<img>` element, which is necessary on Safari and several
 * mobile browsers where `createImageBitmap` is missing or cannot decode the
 * file. Throws only when neither path can decode the image.
 *
 * @param file - The image file to decode.
 * @returns The decoded image.
 */
async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        drawTo: (context, width, height) => context.drawImage(bitmap, 0, 0, width, height),
        release: () => bitmap.close(),
      };
    } catch (bitmapError) {
      void bitmapError;
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("decode-failed"));
      element.src = url;
    });
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      drawTo: (context, width, height) => context.drawImage(image, 0, 0, width, height),
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/**
 * Largest acceptable encoded size before extra JPEG quality is traded away.
 * Keeps uploads comfortably under the server action body limit even when the
 * browser cannot encode the much smaller WebP (e.g. Safari on iOS).
 */
const TARGET_BYTES = 800 * 1024;

/**
 * Encodes a canvas to a blob of the given MIME type, resolving null when the
 * browser substitutes a different format (its way of saying it is unsupported).
 *
 * @param canvas - The canvas to encode.
 * @param type - The desired MIME type.
 * @param quality - The output quality between 0 and 1.
 * @returns The encoded blob, or null when the type is unsupported.
 */
async function toBlobOfType(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
  return blob !== null && blob.type === type ? blob : null;
}

/**
 * Encodes a canvas to a compressed image. Prefers WebP; when the browser cannot
 * encode WebP (older Safari, iOS) it falls back to JPEG and lowers the quality
 * until the result fits the target size, since JPEG is far less efficient.
 *
 * @param canvas - The canvas to encode.
 * @param quality - The starting quality between 0 and 1.
 * @returns The encoded blob and its MIME type, or null when encoding fails.
 */
async function encodeCanvas(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<{ blob: Blob; type: string } | null> {
  const webp = await toBlobOfType(canvas, "image/webp", quality);
  if (webp !== null) {
    return { blob: webp, type: "image/webp" };
  }
  let current = quality;
  let best = await toBlobOfType(canvas, "image/jpeg", current);
  while (best !== null && best.size > TARGET_BYTES && current > 0.45) {
    current -= 0.12;
    const next = await toBlobOfType(canvas, "image/jpeg", current);
    if (next === null) {
      break;
    }
    best = next;
  }
  return best === null ? null : { blob: best, type: "image/jpeg" };
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
  maxEdge = 1600,
  quality = 0.82,
): Promise<CompressedImage> {
  const decoded = await decodeImage(file);
  const { width: sourceWidth, height: sourceHeight } = decoded;

  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    decoded.release();
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
    decoded.release();
    return { file, width: sourceWidth, height: sourceHeight };
  }
  decoded.drawTo(context, width, height);
  decoded.release();

  const encoded = await encodeCanvas(canvas, quality);
  if (encoded === null || encoded.blob.size >= file.size) {
    return { file, width: sourceWidth, height: sourceHeight };
  }
  return {
    file: new File([encoded.blob], renameForType(file.name, encoded.type), { type: encoded.type }),
    width,
    height,
  };
}
