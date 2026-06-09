"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { IconButton } from "@/components/ui";
import { CameraIcon, CloseIcon } from "@/icons";

/**
 * Props for the {@link CameraCapture} component.
 */
export type CameraCaptureProps = {
  onCapture: (file: File) => void;
  onClose: () => void;
};

/**
 * Webcam capture modal: opens the device camera through `getUserMedia` (works on
 * desktop and mobile, unlike the file input's `capture` attribute), shows a live
 * preview, and turns a snapshot into a JPEG `File`. The stream is stopped on
 * close. Rendered in a portal over a dark scrim.
 *
 * @param props - The capture and close handlers.
 * @returns The camera modal, or null on the server.
 */
export function CameraCapture({ onCapture, onClose }: CameraCaptureProps): ReactElement | null {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current !== null) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => setError("Couldn't access the camera. Check the browser permissions."));
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      active = false;
      document.removeEventListener("keydown", onKeyDown);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onClose]);

  const capture = (): void => {
    const video = videoRef.current;
    if (video === null || video.videoWidth === 0) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob !== null) {
          onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" }));
          onClose();
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-ink/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Take a photo"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-bg shadow-pop"
      >
        <IconButton
          label="Close camera"
          tone="solid"
          className="absolute right-3 top-3 z-10"
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        {error !== null ? (
          <p className="px-6 py-16 text-center text-ink-soft">{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-[4/3] w-full bg-ink object-cover"
            />
            <div className="flex justify-center py-4">
              <button
                type="button"
                aria-label="Capture photo"
                onClick={capture}
                className="grid size-14 cursor-pointer place-items-center rounded-full bg-accent text-bg transition-colors hover:bg-accent-press"
              >
                <CameraIcon size={24} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
