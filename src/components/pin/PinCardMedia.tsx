"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ReactElement } from "react";
import { usePrefersReducedMotion } from "@/hooks";
import { PlayIcon } from "@/icons";
import type { Pin } from "@/types/domain";

/**
 * Props for the {@link PinCardMedia} component.
 */
export type PinCardMediaProps = {
  pin: Pin;
  sizes?: string;
};

/**
 * The media shown on a pin card: always the poster image, plus — for a video
 * pin — a centered play badge and a muted, looped clip that autoplays while the
 * card is hovered (desktop pointers only). Hover playback is suppressed under
 * `prefers-reduced-motion`, leaving just the poster and badge. Image pins render
 * the poster alone, unchanged.
 *
 * @param props - The pin and the responsive `sizes` hint for the poster.
 * @returns The card media element.
 */
export function PinCardMedia({ pin, sizes }: PinCardMediaProps): ReactElement {
  const isVideo = pin.mediaType === "VIDEO" && pin.videoUrl !== null;
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onEnter = (): void => {
    if (isVideo && !reduced) {
      setActive(true);
    }
  };

  const onLeave = (): void => {
    if (!isVideo) {
      return;
    }
    setActive(false);
    const video = videoRef.current;
    if (video !== null) {
      video.pause();
      video.currentTime = 0;
    }
  };

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Image
        src={pin.imageUrl}
        alt={pin.altText ?? pin.title}
        width={pin.width}
        height={pin.height}
        sizes={sizes}
        className="w-full"
      />
      {isVideo && active ? (
        <video
          ref={videoRef}
          src={pin.videoUrl ?? undefined}
          poster={pin.imageUrl}
          muted
          loop
          playsInline
          autoPlay
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
      {isVideo && !active ? (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full bg-ink/55 text-bg backdrop-blur">
            <PlayIcon size={22} />
          </span>
        </span>
      ) : null}
    </div>
  );
}
