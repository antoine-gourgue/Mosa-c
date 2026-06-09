import type { ReactElement } from "react";

/**
 * Props for the {@link MessageImage} component.
 */
export type MessageImageProps = {
  url: string;
};

/**
 * An image or animated GIF attached to a message, rendered as a constrained,
 * rounded thumbnail that opens the full-size file in a new tab. A plain `img` is
 * used so animated GIFs play and arbitrary aspect ratios render without a known
 * intrinsic size.
 *
 * @param props - The attachment URL.
 * @returns The image attachment element.
 */
export function MessageImage({ url }: MessageImageProps): ReactElement {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-fit overflow-hidden rounded-2xl bg-surface"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Shared image"
        loading="lazy"
        className="max-h-80 max-w-[240px] rounded-2xl object-cover"
      />
    </a>
  );
}
