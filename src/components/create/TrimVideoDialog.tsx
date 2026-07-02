"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { Button, Sheet } from "@/components/ui";
import { PlayIcon } from "@/icons";
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
 * the full range untouched skips ffmpeg and returns the original. Uses the
 * shared {@link Sheet} primitive (bottom sheet on mobile, dialog on desktop).
 *
 * @param props - The source file and the cancel / apply callbacks.
 * @returns The dialog element.
 */
export function TrimVideoDialog({ file, onCancel, onApply }: TrimVideoDialogProps): ReactElement {
  const t = useTranslations("create");
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragging = useRef<"start" | "end" | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const video = videoRef.current;
    if (video !== null) {
      video.src = url;
    }
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleClose = (): void => {
    if (!trimming) {
      onCancel();
    }
  };

  const applyDuration = (total: number): void => {
    setDuration(total);
    setEnd(Math.min(total, MAX_VIDEO_SECONDS));
  };

  const onLoadedMetadata = (): void => {
    const video = videoRef.current;
    if (video === null) {
      return;
    }
    if (Number.isFinite(video.duration) && video.duration > 0) {
      applyDuration(video.duration);
    } else {
      video.currentTime = 1e7;
    }
  };

  const onDurationChange = (): void => {
    const video = videoRef.current;
    if (video !== null && duration === 0 && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = 0;
      applyDuration(video.duration);
    }
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
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const onTimeUpdate = (): void => {
    const video = videoRef.current;
    if (video !== null && !video.paused && video.currentTime >= end) {
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

  return (
    <Sheet open onClose={handleClose} title={t("trimTitle")}>
      <p className="text-sm text-ink-soft">{t("trimHint")}</p>

      <div className="relative mt-4 overflow-hidden rounded-2xl bg-ink">
        <video
          ref={videoRef}
          muted
          playsInline
          onLoadedMetadata={onLoadedMetadata}
          onDurationChange={onDurationChange}
          onTimeUpdate={onTimeUpdate}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setError(t("videoUnreadable"))}
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
    </Sheet>
  );
}
