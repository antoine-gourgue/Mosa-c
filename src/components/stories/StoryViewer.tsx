"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { Avatar, IconButton } from "@/components/ui";
import { CloseIcon } from "@/icons";
import { cn } from "@/lib/cn";
import type { StoryReelItem } from "@/types/domain";

/**
 * Props for the {@link StoryViewer} component.
 */
export type StoryViewerProps = {
  reel: StoryReelItem[];
  startIndex: number;
  onClose: () => void;
};

type Position = { author: number; segment: number };

/**
 * Full-screen story viewer overlay. Shows one author's current segment (image,
 * or a muted autoplaying video that advances when it ends), with tap zones to
 * move to the previous/next segment — rolling over to the previous/next author
 * — a close button and keyboard arrows/Escape. The timed progress bars and view
 * recording are layered on separately.
 *
 * @param props - The ordered reel, the author to open at, and the close handler.
 * @returns The viewer overlay, or null when the reel is empty.
 */
export function StoryViewer({ reel, startIndex, onClose }: StoryViewerProps): ReactElement | null {
  const t = useTranslations("stories");
  const [pos, setPos] = useState<Position>({ author: startIndex, segment: 0 });

  const goNext = (): void => {
    setPos((current) => {
      const author = reel[current.author];
      if (author !== undefined && current.segment < author.stories.length - 1) {
        return { author: current.author, segment: current.segment + 1 };
      }
      if (current.author < reel.length - 1) {
        return { author: current.author + 1, segment: 0 };
      }
      return current;
    });
    const author = reel[pos.author];
    if (
      author !== undefined &&
      pos.segment >= author.stories.length - 1 &&
      pos.author >= reel.length - 1
    ) {
      onClose();
    }
  };

  const goPrev = (): void => {
    setPos((current) => {
      if (current.segment > 0) {
        return { author: current.author, segment: current.segment - 1 };
      }
      if (current.author > 0) {
        const prev = reel[current.author - 1];
        return {
          author: current.author - 1,
          segment: Math.max(0, (prev?.stories.length ?? 1) - 1),
        };
      }
      return current;
    });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowRight") {
        goNext();
      } else if (event.key === "ArrowLeft") {
        goPrev();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, reel, onClose]);

  const author = reel[pos.author];
  if (author === undefined) {
    return null;
  }
  const story = author.stories[pos.segment];
  if (story === undefined) {
    return null;
  }

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[140] grid place-items-center bg-ink/90 p-3 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="relative aspect-[9/16] max-h-[94vh] w-auto max-w-[440px] overflow-hidden rounded-2xl bg-ink shadow-pop"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.imageUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
        />

        {story.mediaType === "VIDEO" && story.videoUrl !== null ? (
          <video
            key={story.id}
            src={story.videoUrl}
            poster={story.imageUrl}
            muted
            autoPlay
            playsInline
            onEnded={goNext}
            className="relative size-full object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={story.id}
            src={story.imageUrl}
            alt=""
            className="relative size-full object-contain"
          />
        )}

        <button
          type="button"
          aria-label={t("previous")}
          onClick={goPrev}
          className="absolute inset-y-0 left-0 z-10 w-1/3"
        />
        <button
          type="button"
          aria-label={t("next")}
          onClick={goNext}
          className="absolute inset-y-0 right-0 z-10 w-2/3"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-ink/70 to-transparent" />

        <div className="absolute inset-x-0 top-0 z-30 flex gap-1 p-2">
          {author.stories.map((segment, index) => (
            <span key={segment.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-bg/30">
              <span
                className={cn(
                  "block h-full rounded-full bg-bg transition-all",
                  index <= pos.segment ? "w-full" : "w-0",
                )}
              />
            </span>
          ))}
        </div>

        <div className="absolute inset-x-0 top-0 z-30 flex items-center gap-2 px-3 pb-2 pt-4">
          <Avatar
            src={author.author.avatarUrl ?? undefined}
            name={author.author.name}
            size={32}
            verified={author.author.verified}
          />
          <span className="text-sm font-semibold text-bg drop-shadow">{author.author.name}</span>
          <div className="ml-auto">
            <IconButton label={t("close")} tone="solid" onClick={onClose}>
              <CloseIcon size={18} />
            </IconButton>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
