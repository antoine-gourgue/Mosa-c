"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactElement } from "react";
import { Button } from "@/components/ui";
import { SendIcon, SparkleIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { ensureDisplayableImage, isHeicFile } from "@/lib/image";
import {
  MAX_VIDEO_BYTES,
  MAX_VIDEO_SECONDS,
  extractVideoPoster,
  isAcceptedVideo,
} from "@/lib/video";
import { GenerateImageDialog } from "./GenerateImageDialog";
import { UrlImageDialog } from "./UrlImageDialog";

/**
 * Media selected in the upload area, with its preview URL and intrinsic
 * dimensions. For a video, `file` is the generated poster image, `previewUrl`
 * points at the clip itself, and `videoFile` / `durationS` carry the upload.
 */
export type SelectedImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  mediaType: "IMAGE" | "VIDEO";
  videoFile?: File;
  durationS?: number;
};

/**
 * Props for the {@link UploadDropzone} component.
 */
export type UploadDropzoneProps = {
  value: SelectedImage | null;
  onChange: (value: SelectedImage | null) => void;
  /** Whether AI image generation is configured; hides the entry when false. */
  imageGenEnabled?: boolean;
  /** Open the AI generation dialog on mount (the "Generate with AI" entry). */
  initialGenerate?: boolean;
};

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Loads an image file to read its intrinsic dimensions and a preview URL.
 *
 * @param file - The image file.
 * @returns The selected image descriptor.
 */
function readImage(file: File): Promise<SelectedImage> {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      resolve({
        file,
        previewUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
        mediaType: "IMAGE",
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error("invalid-image"));
    };
    image.src = previewUrl;
  });
}

/**
 * Pinterest-style upload area: a tall filled drop card supporting click and
 * drag-and-drop, with image type and size validation, a live preview and
 * replacement, plus a "Save from URL" affordance that fetches a remote image
 * and feeds it through the same pipeline. Reports the file and its intrinsic
 * dimensions through `onChange`.
 *
 * @param props - The selected image and the change handler.
 * @returns The upload area element.
 */
export function UploadDropzone({
  value,
  onChange,
  imageGenEnabled = false,
  initialGenerate = false,
}: UploadDropzoneProps): ReactElement {
  const t = useTranslations("create");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(initialGenerate && imageGenEnabled);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (selected: SelectedImage): void => {
    if (value !== null) {
      URL.revokeObjectURL(value.previewUrl);
    }
    onChange(selected);
  };

  const handleVideo = async (file: File): Promise<void> => {
    if (!isAcceptedVideo(file)) {
      setError(t("chooseVideoFile"));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError(t("videosMax50"));
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const { poster, width, height, durationS } = await extractVideoPoster(file);
      if (durationS > MAX_VIDEO_SECONDS) {
        setError(t("videosMax60s"));
        return;
      }
      commit({
        file: poster,
        previewUrl: URL.createObjectURL(file),
        width,
        height,
        mediaType: "VIDEO",
        videoFile: file,
        durationS,
      });
    } catch {
      setError(t("videoUnreadable"));
    } finally {
      setProcessing(false);
    }
  };

  const handleFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) {
      return;
    }
    if (file.type.startsWith("video/")) {
      await handleVideo(file);
      return;
    }
    if (!file.type.startsWith("image/") && !isHeicFile(file)) {
      setError(t("chooseImageFile"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("imagesMax10"));
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const displayable = await ensureDisplayableImage(file);
      const selected = await readImage(displayable);
      commit(selected);
    } catch {
      setError(t("imageUnreadable"));
    } finally {
      setProcessing(false);
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    void handleFile(event.target.files?.[0]);
  };

  useEffect(() => {
    const pending = inputRef.current?.files?.[0];
    if (pending !== undefined) {
      void handleFile(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrop = (event: DragEvent<HTMLLabelElement>): void => {
    event.preventDefault();
    setDragActive(false);
    void handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className="block cursor-pointer"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif,video/mp4,video/webm"
          className="hidden"
          onChange={onInputChange}
        />
        {processing ? (
          <div className="grid min-h-[460px] place-items-center rounded-xl bg-surface text-[15px] font-semibold text-ink">
            {t("processing")}
          </div>
        ) : value === null ? (
          <div
            className={cn(
              "relative flex min-h-[460px] flex-col items-center justify-center rounded-xl bg-surface px-6 text-center transition-shadow",
              dragActive ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : "",
            )}
          >
            <span className="grid size-14 place-items-center rounded-full border-2 border-ink text-ink">
              <SendIcon size={24} />
            </span>
            <p className="mt-4 text-[15px] font-semibold leading-snug text-ink">
              {t("dropLine1")}
              <br />
              {t("dropLine2")}
            </p>
            <p className="absolute inset-x-6 bottom-8 mx-auto max-w-[280px] text-sm text-ink-soft">
              {t("fileHint")}
            </p>
          </div>
        ) : (
          <div
            role="img"
            aria-label={t("selectedPreview")}
            className={cn(
              "rounded-xl transition-shadow",
              dragActive ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : "",
            )}
          >
            {value.mediaType === "VIDEO" ? (
              <video
                src={value.previewUrl}
                controls
                muted
                playsInline
                className="mx-auto block max-h-[70vh] w-auto max-w-full rounded-xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value.previewUrl}
                alt=""
                className="mx-auto block max-h-[70vh] w-auto max-w-full rounded-xl"
              />
            )}
          </div>
        )}
      </label>

      {error !== null ? (
        <p role="alert" className="mt-2 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <div className="my-4 border-t border-line" />
      <div className="flex gap-2">
        <Button variant="ghost" fullWidth onClick={() => setUrlOpen(true)}>
          {t("saveFromUrl")}
        </Button>
        {imageGenEnabled ? (
          <Button
            variant="ghost"
            fullWidth
            leftIcon={<SparkleIcon size={18} className="text-accent" />}
            onClick={() => setGenOpen(true)}
          >
            {t("generateWithAi")}
          </Button>
        ) : null}
      </div>

      <UrlImageDialog
        open={urlOpen}
        onClose={() => setUrlOpen(false)}
        onPicked={(file) => {
          setUrlOpen(false);
          void handleFile(file);
        }}
      />
      {imageGenEnabled ? (
        <GenerateImageDialog
          open={genOpen}
          onClose={() => setGenOpen(false)}
          onPicked={(file) => {
            setGenOpen(false);
            void handleFile(file);
          }}
        />
      ) : null}
    </div>
  );
}
