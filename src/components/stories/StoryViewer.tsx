"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { Avatar, ConfirmDialog, IconButton } from "@/components/ui";
import { usePrefersReducedMotion } from "@/hooks";
import { ChevronDownIcon, CloseIcon, HeartFilledIcon, HeartIcon, TrashIcon } from "@/icons";
import { likeStory, markStoryViewed, removeStory } from "@/server/actions/stories";
import type { StoryReelItem } from "@/types/domain";
import { StoryViewersSheet } from "./StoryViewersSheet";

/**
 * Props for the {@link StoryViewer} component.
 */
export type StoryViewerProps = {
  reel: StoryReelItem[];
  startIndex: number;
  viewerId: string;
  onClose: () => void;
};

type LikeState = { liked: boolean; count: number };

type Position = { author: number; segment: number };

/** How long an image story segment stays before auto-advancing. */
const IMAGE_DURATION_MS = 5000;
/** Press duration past which a tap counts as a hold (pause), not a navigation. */
const HOLD_MS = 200;

/**
 * Full-screen story viewer overlay, Instagram-style. Shows one author's current
 * segment (image, or a muted autoplaying video) with timed **progress bars**
 * that fill as the segment plays and **auto-advance** to the next segment/author
 * — image segments last {@link IMAGE_DURATION_MS}, videos last their duration.
 * Press and hold pauses; tap zones / arrow keys move; the close button or Escape
 * dismiss. Under `prefers-reduced-motion` auto-advance is disabled (tap to move).
 * Each shown segment is recorded as viewed, and closing refreshes the feed so
 * the rings reflect the seen state.
 *
 * @param props - The ordered reel, the author to open at, and the close handler.
 * @returns The viewer overlay, or null when the reel is empty.
 */
export function StoryViewer({
  reel,
  startIndex,
  viewerId,
  onClose,
}: StoryViewerProps): ReactElement | null {
  const t = useTranslations("stories");
  const router = useRouter();
  const reduced = usePrefersReducedMotion();
  const [pos, setPos] = useState<Position>({ author: startIndex, segment: 0 });
  const [progress, setProgress] = useState(0);
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const [viewersOpen, setViewersOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const progressRef = useRef(0);
  const pausedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewedRef = useRef<Set<string>>(new Set());
  const pressAtRef = useRef(0);

  const setPaused = (value: boolean): void => {
    pausedRef.current = value;
    if (value) {
      videoRef.current?.pause();
    }
  };

  const resetProgress = (): void => {
    progressRef.current = 0;
    setProgress(0);
  };

  const close = (): void => {
    router.refresh();
    onClose();
  };

  const goNext = (): void => {
    resetProgress();
    const author = reel[pos.author];
    const atEnd =
      author !== undefined &&
      pos.segment >= author.stories.length - 1 &&
      pos.author >= reel.length - 1;
    if (atEnd) {
      close();
      return;
    }
    setPos((current) => {
      const item = reel[current.author];
      if (item !== undefined && current.segment < item.stories.length - 1) {
        return { author: current.author, segment: current.segment + 1 };
      }
      return { author: current.author + 1, segment: 0 };
    });
  };

  const goPrev = (): void => {
    resetProgress();
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

  const author = reel[pos.author];
  const story = author?.stories[pos.segment];
  const isVideo = story?.mediaType === "VIDEO" && story.videoUrl !== null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
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

  useEffect(() => {
    if (story === undefined) {
      return;
    }
    if (!viewedRef.current.has(story.id)) {
      viewedRef.current.add(story.id);
      void markStoryViewed(story.id);
    }
    if (reduced) {
      return;
    }
    progressRef.current = 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number): void => {
      const delta = now - last;
      last = now;
      if (!pausedRef.current) {
        if (isVideo) {
          const video = videoRef.current;
          if (video !== null && video.duration > 0) {
            progressRef.current = Math.min(1, video.currentTime / video.duration);
            setProgress(progressRef.current);
          }
        } else {
          progressRef.current = Math.min(1, progressRef.current + delta / IMAGE_DURATION_MS);
          setProgress(progressRef.current);
          if (progressRef.current >= 1) {
            goNext();
            return;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, reduced]);

  if (author === undefined || story === undefined) {
    return null;
  }

  const onPressStart = (): void => {
    pressAtRef.current = Date.now();
    setPaused(true);
  };

  const onPressEnd = (): void => {
    if (!viewersOpen && !confirmDelete) {
      setPaused(false);
      if (isVideo) {
        void videoRef.current?.play();
      }
    }
  };

  const onZone = (
    event: ReactPointerEvent<HTMLButtonElement>,
    direction: "next" | "prev",
  ): void => {
    event.preventDefault();
    if (Date.now() - pressAtRef.current > HOLD_MS) {
      return;
    }
    if (direction === "next") {
      goNext();
    } else {
      goPrev();
    }
  };

  const isOwn = author.author.id === viewerId;
  const like = likes[story.id] ?? { liked: story.likedByViewer, count: story.likeCount };

  const toggleLike = (): void => {
    const next = { liked: !like.liked, count: like.count + (like.liked ? -1 : 1) };
    setLikes((current) => ({ ...current, [story.id]: next }));
    void likeStory(story.id).then((result) =>
      setLikes((current) => ({
        ...current,
        [story.id]: { liked: result.liked, count: result.likeCount },
      })),
    );
  };

  const openViewers = (): void => {
    setViewersOpen(true);
    setPaused(true);
  };

  const closeViewers = (): void => {
    setViewersOpen(false);
    setPaused(false);
    if (isVideo) {
      void videoRef.current?.play();
    }
  };

  const onDelete = (): void => {
    void removeStory(story.id).then((result) => {
      setConfirmDelete(false);
      if (result.ok) {
        router.refresh();
        goNext();
      }
    });
  };

  return createPortal(
    <div
      onClick={close}
      className="fixed inset-0 z-[140] grid place-items-center bg-ink/90 p-3 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={onPressStart}
        onPointerUp={onPressEnd}
        onPointerLeave={onPressEnd}
        className="relative aspect-[9/16] max-h-[94vh] w-auto max-w-[440px] overflow-hidden rounded-2xl bg-ink shadow-pop"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={story.imageUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
        />

        {isVideo && story.videoUrl !== null ? (
          <video
            key={story.id}
            ref={videoRef}
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
          onPointerUp={(event) => onZone(event, "prev")}
          className="absolute inset-y-0 left-0 z-10 w-1/3"
        />
        <button
          type="button"
          aria-label={t("next")}
          onPointerUp={(event) => onZone(event, "next")}
          className="absolute inset-y-0 right-0 z-10 w-2/3"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-24 bg-gradient-to-b from-ink/70 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex gap-1 p-2">
          {author.stories.map((segment, index) => {
            const width =
              index < pos.segment ? 100 : index > pos.segment ? 0 : reduced ? 100 : progress * 100;
            return (
              <span key={segment.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-bg/30">
                <span style={{ width: `${width}%` }} className="block h-full rounded-full bg-bg" />
              </span>
            );
          })}
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
            <IconButton label={t("close")} tone="solid" onClick={close}>
              <CloseIcon size={18} />
            </IconButton>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-30 flex items-center gap-3 bg-gradient-to-t from-ink/70 to-transparent px-4 pb-4 pt-10">
          {isOwn ? (
            <>
              <button
                type="button"
                onClick={openViewers}
                className="flex items-center gap-1.5 text-sm font-semibold text-bg"
              >
                <ChevronDownIcon size={18} className="rotate-180" />
                {t("viewerCount", { count: story.viewerCount })}
              </button>
              <div className="ml-auto">
                <IconButton
                  label={t("deleteStory")}
                  tone="solid"
                  onClick={() => {
                    setConfirmDelete(true);
                    setPaused(true);
                  }}
                >
                  <TrashIcon size={18} />
                </IconButton>
              </div>
            </>
          ) : (
            <div className="ml-auto">
              <IconButton
                label={like.liked ? t("unlike") : t("like")}
                tone="solid"
                onClick={toggleLike}
              >
                {like.liked ? (
                  <HeartFilledIcon size={18} className="text-accent" />
                ) : (
                  <HeartIcon size={18} />
                )}
              </IconButton>
            </div>
          )}
        </div>

        {viewersOpen ? <StoryViewersSheet storyId={story.id} onClose={closeViewers} /> : null}
      </div>

      <div onClick={(event) => event.stopPropagation()}>
        <ConfirmDialog
          open={confirmDelete}
          title={t("deleteStoryTitle")}
          confirmLabel={t("delete")}
          destructive
          onConfirm={onDelete}
          onCancel={() => {
            setConfirmDelete(false);
            setPaused(false);
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
