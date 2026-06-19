"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { IconButton } from "@/components/ui";
import { CloseIcon, RefreshIcon } from "@/icons";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link CameraCapture} component.
 */
export type CameraCaptureProps = {
  onCapture: (file: File) => void;
  onClose: () => void;
};

/** Longest in-app recording, matching the video upload limit. */
const MAX_SECONDS = 60;

/**
 * Picks the best supported recording MIME type, preferring MP4, then WebM.
 *
 * @returns The MIME type, or null when none is supported.
 */
function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") {
    return null;
  }
  const candidates = [
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

/**
 * Formats seconds as `m:ss`.
 */
function clock(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Full-screen in-app camera: a live preview via `getUserMedia` with a photo
 * mode (canvas snapshot → JPEG) and a video mode (`MediaRecorder` → MP4/WebM,
 * auto-stopping at {@link MAX_SECONDS}). Supports front/back switching and
 * surfaces a clear message when access is denied or unavailable. The captured
 * file is handed back through `onCapture` to flow through the normal pipeline.
 *
 * @param props - The capture and close callbacks.
 * @returns The camera overlay element.
 */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps): ReactElement {
  const t = useTranslations("create");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stopStream = (): void => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const clearTimer = (): void => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    let active = true;
    const start = async (): Promise<void> => {
      try {
        const constraints = { video: { facingMode: facing }, audio: true };
        const stream = await navigator.mediaDevices
          .getUserMedia(constraints)
          .catch(() => navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } }));
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current !== null) {
          videoRef.current.srcObject = stream;
        }
        setError(null);
      } catch {
        if (active) {
          setError(t("cameraDenied"));
        }
      }
    };
    void start();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [facing, t]);

  useEffect(() => () => clearTimer(), []);

  const close = (): void => {
    clearTimer();
    stopStream();
    onClose();
  };

  const takePhoto = (): void => {
    const video = videoRef.current;
    if (video === null || video.videoWidth === 0) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          return;
        }
        stopStream();
        onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  };

  const stopRecording = (): void => {
    clearTimer();
    recorderRef.current?.stop();
    setRecording(false);
  };

  const attach = (recorder: MediaRecorder): void => {
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const raw = recorder.mimeType || chunksRef.current[0]?.type || "video/mp4";
      const type = raw.includes("webm")
        ? "video/webm"
        : raw.includes("quicktime") || raw.includes("mov")
          ? "video/quicktime"
          : "video/mp4";
      const ext = type === "video/webm" ? "webm" : type === "video/quicktime" ? "mov" : "mp4";
      const blob = new Blob(chunksRef.current, { type });
      stopStream();
      onCapture(new File([blob], `clip-${Date.now()}.${ext}`, { type }));
    };
    recorderRef.current = recorder;
  };

  const startRecording = (): void => {
    const stream = streamRef.current;
    if (stream === null) {
      return;
    }
    const mime = pickMime();
    try {
      const recorder =
        mime !== null ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      attach(recorder);
      recorder.start();
    } catch {
      try {
        const fallback = new MediaRecorder(stream);
        attach(fallback);
        fallback.start();
      } catch {
        setError(t("cameraError"));
        return;
      }
    }
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((value) => {
        const next = value + 1;
        if (next >= MAX_SECONDS) {
          stopRecording();
        }
        return next;
      });
    }, 1000);
  };

  const onShutter = (): void => {
    if (mode === "photo") {
      takePhoto();
    } else if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] flex flex-col bg-ink">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
        <IconButton label={t("closeCamera")} tone="solid" onClick={close}>
          <CloseIcon size={18} />
        </IconButton>
        {recording ? (
          <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-bg">
            {clock(elapsed)}
          </span>
        ) : null}
        <IconButton
          label={t("switchCamera")}
          tone="solid"
          onClick={() => setFacing((value) => (value === "user" ? "environment" : "user"))}
        >
          <RefreshIcon size={18} />
        </IconButton>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {error !== null ? (
          <p className="max-w-xs px-6 text-center text-sm text-bg/80">{error}</p>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn("size-full object-cover", facing === "user" ? "-scale-x-100" : "")}
          />
        )}
      </div>

      {error === null ? (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 pb-8">
          {!recording ? (
            <div className="flex gap-1 rounded-full bg-bg/15 p-1 text-sm font-semibold text-bg backdrop-blur">
              <button
                type="button"
                onClick={() => setMode("photo")}
                className={cn(
                  "rounded-full px-4 py-1.5 transition-colors",
                  mode === "photo" ? "bg-bg text-ink" : "text-bg",
                )}
              >
                {t("photo")}
              </button>
              <button
                type="button"
                onClick={() => setMode("video")}
                className={cn(
                  "rounded-full px-4 py-1.5 transition-colors",
                  mode === "video" ? "bg-bg text-ink" : "text-bg",
                )}
              >
                {t("video")}
              </button>
            </div>
          ) : null}
          <button
            type="button"
            aria-label={mode === "photo" ? t("takePhoto") : recording ? t("stop") : t("record")}
            onClick={onShutter}
            className="grid size-16 place-items-center rounded-full ring-4 ring-bg"
          >
            <span
              className={cn(
                "block transition-all",
                mode === "video"
                  ? recording
                    ? "size-6 rounded-md bg-accent"
                    : "size-12 rounded-full bg-accent"
                  : "size-12 rounded-full bg-bg",
              )}
            />
          </button>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
