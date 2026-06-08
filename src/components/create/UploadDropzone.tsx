"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, ReactElement } from "react";
import { Button } from "@/components/ui";
import { SendIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { ensureDisplayableImage, isHeicFile } from "@/lib/image";
import { UrlImageDialog } from "./UrlImageDialog";

/**
 * An image selected in the upload area, with its preview URL and intrinsic
 * dimensions.
 */
export type SelectedImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
};

/**
 * Props for the {@link UploadDropzone} component.
 */
export type UploadDropzoneProps = {
  value: SelectedImage | null;
  onChange: (value: SelectedImage | null) => void;
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
      resolve({ file, previewUrl, width: image.naturalWidth, height: image.naturalHeight });
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
export function UploadDropzone({ value, onChange }: UploadDropzoneProps): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) {
      return;
    }
    if (!file.type.startsWith("image/") && !isHeicFile(file)) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images must be 10 MB or smaller.");
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const displayable = await ensureDisplayableImage(file);
      const selected = await readImage(displayable);
      if (value !== null) {
        URL.revokeObjectURL(value.previewUrl);
      }
      onChange(selected);
    } catch {
      setError("That image could not be read.");
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
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={onInputChange}
        />
        {processing ? (
          <div className="grid min-h-[460px] place-items-center rounded-xl bg-surface text-[15px] font-semibold text-ink">
            Processing photo…
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
              Choose a file or
              <br />
              drag it here
            </p>
            <p className="absolute inset-x-6 bottom-8 mx-auto max-w-[280px] text-sm text-ink-soft">
              We recommend high-quality .jpg, .png or .heic files, up to 10 MB.
            </p>
          </div>
        ) : (
          <div
            role="img"
            aria-label="Selected preview"
            className={cn(
              "rounded-xl transition-shadow",
              dragActive ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : "",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.previewUrl}
              alt=""
              className="mx-auto block max-h-[70vh] w-auto max-w-full rounded-xl"
            />
          </div>
        )}
      </label>

      {error !== null ? (
        <p role="alert" className="mt-2 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <div className="my-4 border-t border-line" />
      <Button variant="ghost" fullWidth onClick={() => setUrlOpen(true)}>
        Save from URL
      </Button>

      <UrlImageDialog
        open={urlOpen}
        onClose={() => setUrlOpen(false)}
        onPicked={(file) => {
          setUrlOpen(false);
          void handleFile(file);
        }}
      />
    </div>
  );
}
