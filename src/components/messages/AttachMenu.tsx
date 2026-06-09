"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { CameraIcon, ImageIcon, PlusIcon } from "@/icons";
import { CameraCapture } from "./CameraCapture";
import { GifPicker } from "./GifPicker";

/**
 * Props for the {@link AttachMenu} component.
 */
export type AttachMenuProps = {
  onPickFile: (file: File) => void;
  onPickGifUrl: (url: string) => void;
};

/**
 * Composer attachment control: a "+" button opening an upward menu with three
 * options — **take a photo** (camera capture), **upload a photo** from the
 * device, and a **GIF** search (Giphy). Photo files go to `onPickFile`; a chosen
 * GIF's URL goes to `onPickGifUrl`. Closes on outside click or Escape.
 *
 * @param props - The file- and GIF-chosen handlers.
 * @returns The attachment menu element.
 */
export function AttachMenu({ onPickFile, onPickGifUrl }: AttachMenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "gif">("menu");
  const [cameraOpen, setCameraOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const close = (): void => {
    setOpen(false);
    setMode("menu");
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file !== undefined) {
      onPickFile(file);
    }
    event.target.value = "";
    close();
  };

  const pick = (ref: typeof galleryRef): void => {
    ref.current?.click();
  };

  const iconClass =
    "grid size-10 cursor-pointer place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface hover:text-ink";

  return (
    <div ref={rootRef} className="relative">
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onChange} />

      {cameraOpen ? (
        <CameraCapture onCapture={onPickFile} onClose={() => setCameraOpen(false)} />
      ) : null}

      <button
        type="button"
        aria-label="Add an attachment"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface hover:text-ink"
      >
        <PlusIcon size={20} />
      </button>

      {open ? (
        <div className="absolute bottom-full left-0 z-30 mb-2 rounded-xl border border-line bg-bg p-1.5 shadow-pop">
          {mode === "menu" ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Take a photo"
                title="Take a photo"
                className={iconClass}
                onClick={() => {
                  close();
                  setCameraOpen(true);
                }}
              >
                <CameraIcon size={20} />
              </button>
              <button
                type="button"
                aria-label="Upload a photo"
                title="Upload a photo"
                className={iconClass}
                onClick={() => pick(galleryRef)}
              >
                <ImageIcon size={20} />
              </button>
              <button
                type="button"
                aria-label="Send a GIF"
                title="Send a GIF"
                className={`${iconClass} text-[11px] font-bold`}
                onClick={() => setMode("gif")}
              >
                GIF
              </button>
            </div>
          ) : (
            <div className="p-1">
              <GifPicker
                onSelect={(url) => {
                  onPickGifUrl(url);
                  close();
                }}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
