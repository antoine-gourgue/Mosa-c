"use client";

import { useState } from "react";
import type { ChangeEvent, DragEvent, ReactElement } from "react";
import { cn } from "@/lib/cn";
import { PlusIcon } from "@/icons";

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
 * Upload area supporting click and drag-and-drop, with image type and size
 * validation, a live preview and replacement. Reports the file and its
 * intrinsic dimensions through `onChange`.
 *
 * @param props - The selected image and the change handler.
 * @returns The upload area element.
 */
export function UploadDropzone({ value, onChange }: UploadDropzoneProps): ReactElement {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File | undefined): Promise<void> => {
    if (file === undefined) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images must be 10 MB or smaller.");
      return;
    }
    try {
      const selected = await readImage(file);
      if (value !== null) {
        URL.revokeObjectURL(value.previewUrl);
      }
      setError(null);
      onChange(selected);
    } catch {
      setError("That image could not be read.");
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    void handleFile(event.target.files?.[0]);
  };

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
        <input type="file" accept="image/*" className="hidden" onChange={onInputChange} />
        <div
          className={cn(
            "grid min-h-[440px] place-items-center overflow-hidden rounded-3xl border-2 border-dashed bg-surface p-6 text-center text-ink-soft transition-colors hover:border-ink-faint",
            dragActive ? "border-accent bg-accent/[0.04]" : "border-surface-3",
          )}
        >
          {value === null ? (
            <div className="px-4">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-bg text-ink shadow-pop">
                <PlusIcon size={28} />
              </span>
              <div className="mt-4 text-[15px] font-semibold text-ink">
                Choose a file or drag it here
              </div>
              <div className="mt-1 text-sm">
                We recommend high-quality .jpg or .png, up to 10 MB
              </div>
            </div>
          ) : (
            <div
              role="img"
              aria-label="Selected preview"
              style={{ backgroundImage: `url(${value.previewUrl})` }}
              className="h-[440px] w-full rounded-2xl bg-contain bg-center bg-no-repeat"
            />
          )}
        </div>
      </label>
      {error !== null ? (
        <p role="alert" className="mt-2 text-sm text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}
