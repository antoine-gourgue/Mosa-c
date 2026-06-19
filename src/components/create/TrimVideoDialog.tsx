"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { Button } from "@/components/ui";
import { CloseIcon, PlayIcon } from "@/icons";
import { MAX_VIDEO_SECONDS } from "@/lib/video";
import { trimVideo } from "@/lib/video-trim";

/**
 * Props for the {@link TrimVideoDialog} component.
 */
export type TrimVideoDialogProps = {
  file: File;
  onCancel: () => void;
  onApply: (file: File) => void;
};

const MIN_SELECTION_S = 1;

/**
 * Formats a number of seconds as `m:ss`.
 *
 * @param seconds - The time in seconds.
 * @returns The `m:ss` label.
 */
function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Modal editor to trim a selected video before publishing: a preview that loops
 * within the chosen range, and a two-handle bar to pick the start and end (kept
 * within {@link MAX_VIDEO_SECONDS}). Applying cuts the clip in-browser with
 * ffmpeg.wasm (stream copy, lossless) and hands the shorter file back; leaving
 * the full range untouched skips ffmpeg and returns the original. Rendered in a
 * portal with a dimmed backdrop.
 *
 * @param props - The source file and the cancel / apply callbacks.
 * @returns The dialog element.
 */
export function TrimVideoDialog({ file, onCancel, onApply }: TrimVideoDialogProps): ReactElement {
  const t = useTranslations("create");
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragging = useRef<"start" | "end" | null>(null);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const onLoadedMetadata = (): void => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    const total = Number.isFinite(video.duration) ? video.duration : 0;
    setDuration(total);
    setEnd(Math.min(total, MAX_VIDEO_SECONDS));
  };

  const seek = (to: number): void => {
    const video = videoRef.current;
    if (video !== null) {
      video.currentTime = to;
    }
  };

  const moveHandle = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    const which = dragging.current;
    const track = trackRef.current;
    if (which === null || track === null || duration === 0) {
      return;
    }
    const rect = track.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const value = fraction * duration;
    if (which === "start") {
      const next = Math.min(value, end - MIN_SELECTION_S);
      const clamped = Math.max(0, Math.max(next, end - MAX_VIDEO_SECONDS));
      setStart(clamped);
      seek(clamped);
    } else {
      const next = Math.max(value, start + MIN_SELECTION_S);
      const clamped = Math.min(duration, Math.min(next, start + MAX_VIDEO_SECONDS));
      setEnd(clamped);
      seek(clamped);
    }
  };

  const beginDrag = (which: "start" | "end", event: ReactPointerEvent<HTMLButtonElement>): void => {
    dragging.current = which;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>): void => {
    dragging.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const togglePlay = (): void => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    if (video.paused) {
      if (video.currentTime < start || video.currentTime >= end) {
        video.currentTime = start;
      }
      void video.play();
    } else {
      video.pause();
    }
  };

  const onTimeUpdate = (): void => {
    const video = videoRef.current;
    if (video !== null && video.currentTime >= end) {
      video.currentTime = start;
    }
  };

  const apply = async (): Promise<void> => {
    const isFullRange = start <= 0.05 && end >= duration - 0.05;
    if (isFullRange) {
      onApply(file);
      return;
    }
    setTrimming(true);
    setError(null);
    try {
      const clip = await trimVideo(file, start, end - start);
      onApply(clip);
    } catch {
      setError(t("trimFailed"));
    } finally {
      setTrimming(false);
    }
  };

  const pct = (value: number): string => (duration === 0 ? "0%" : `${(value / duration) * 100}%`);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trim-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-bg p-6 shadow-pop"
      >
        <button
          type="button"
          aria-label={t("cancel")}
          onClick={onCancel}
          disabled={trimming}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
        >
          <CloseIcon size={18} />
        </button>

        <h2 id="trim-dialog-title" className="pr-8 text-xl font-bold text-ink">
          {t("trimTitle")}
        </h2>
        <p className="mt-1 pr-8 text-sm text-ink-soft">{t("trimHint")}</p>

        <div className="relative mt-4 overflow-hidden rounded-2xl bg-ink">
          <video
            ref={videoRef}
            src={previewUrl}
            muted
            playsInline
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onClick={togglePlay}
            className="mx-auto block max-h-[40vh] w-auto max-w-full"
          />
          {!playing ? (
            <button
              type="button"
              aria-label={t("playPreview")}
              onClick={togglePlay}
              className="absolute inset-0 grid place-items-center"
            >
              <span className="grid size-12 place-items-center rounded-full bg-ink/55 text-bg backdrop-blur">
                <PlayIcon size={22} />
              </span>
            </button>
          ) : null}
        </div>

        <div className="mt-5">
          <div ref={trackRef} className="relative h-1.5 rounded-full bg-surface">
            <div
              className="absolute inset-y-0 rounded-full bg-accent"
              style={{ left: pct(start), width: pct(end - start) }}
            />
            <button
              type="button"
              aria-label={t("trimStartHandle")}
              onPointerDown={(event) => beginDrag("start", event)}
              onPointerMove={moveHandle}
              onPointerUp={endDrag}
              style={{ left: pct(start) }}
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full bg-ink ring-2 ring-bg"
            />
            <button
              type="button"
              aria-label={t("trimEndHandle")}
              onPointerDown={(event) => beginDrag("end", event)}
              onPointerMove={moveHandle}
              onPointerUp={endDrag}
              style={{ left: pct(end) }}
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full bg-ink ring-2 ring-bg"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-ink-soft">
            <span>{formatTime(start)}</span>
            <span className="font-semibold text-ink">
              {t("trimSelected", { duration: (end - start).toFixed(1) })}
            </span>
            <span>{formatTime(end)}</span>
          </div>
        </div>

        {error !== null ? (
          <p role="alert" className="mt-3 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button onClick={() => void apply()} loading={trimming} disabled={duration === 0}>
            {t("useClip")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
