/**
 * Text-to-image generation backed by Pollinations (FLUX.2 Schnell) — free and
 * keyless, which suits this project. The image is fetched server-side into a
 * base64 data URL the create flow can turn into a file, mirroring the remote
 * image import. The `fetchImpl` knob is injectable so the generator can be
 * unit-tested without a real network call.
 */

/**
 * A generated image as a base64 data URL with the dimensions it was rendered at.
 */
export type GeneratedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

/**
 * Per-call sizing overrides for a generation, falling back to the generator's
 * configured defaults.
 */
export type ImageGenOptions = {
  width?: number;
  height?: number;
};

/**
 * A text-to-image generator: maps a prompt (with optional per-call sizing) to an
 * image, or null on failure.
 */
export type ImageGenerator = (
  prompt: string,
  options?: ImageGenOptions,
) => Promise<GeneratedImage | null>;

/**
 * Configuration for {@link createImageGenerator}.
 */
export type ImageGenConfig = {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  timeoutMs?: number;
  width?: number;
  height?: number;
};

const ENDPOINT = "https://image.pollinations.ai/prompt";
const USER_AGENT = "Mosaic/1.0 (pin image generation)";
const DEFAULT_WIDTH = 768;
const DEFAULT_HEIGHT = 1024;
const DEFAULT_TIMEOUT_MS = 45_000;

/**
 * Builds a text-to-image generator bound to its config. A blank prompt resolves
 * to null without a network call, the request is time-bounded, and any network,
 * non-image or empty response degrades to null rather than throwing — so the
 * create flow stays usable when generation is unavailable.
 *
 * @param config - Injectable fetch, endpoint and sizing knobs.
 * @returns The generator function.
 */
export function createImageGenerator(config: ImageGenConfig = {}): ImageGenerator {
  const fetchImpl = config.fetchImpl ?? fetch;
  const endpoint = config.endpoint ?? ENDPOINT;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const width = config.width ?? DEFAULT_WIDTH;
  const height = config.height ?? DEFAULT_HEIGHT;

  return async (prompt: string, options?: ImageGenOptions): Promise<GeneratedImage | null> => {
    const trimmed = prompt.trim();
    if (trimmed === "") {
      return null;
    }
    const w = options?.width ?? width;
    const h = options?.height ?? height;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `${endpoint}/${encodeURIComponent(trimmed)}?width=${w}&height=${h}&model=flux&nologo=true`;
      const response = await fetchImpl(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
      });
      if (!response.ok) {
        return null;
      }
      const contentType = response.headers.get("content-type");
      if (contentType === null || !contentType.startsWith("image/")) {
        return null;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0) {
        return null;
      }
      return {
        dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
        width: w,
        height: h,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };
}

/**
 * The shared image generator used by the create flow, backed by live
 * Pollinations.
 */
export const generateImage: ImageGenerator = createImageGenerator();
