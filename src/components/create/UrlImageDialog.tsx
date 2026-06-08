"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { Button, Input } from "@/components/ui";
import { LinkIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { importImageFromUrl } from "@/server/actions/upload";

/**
 * Props for the {@link UrlImageDialog} component.
 */
export type UrlImageDialogProps = {
  open: boolean;
  onClose: () => void;
  onPicked: (file: File) => void;
};

type PreviewStatus = "idle" | "loading" | "ok" | "error";

/**
 * Modal for adding an image from the web by its URL, with a live preview. As the
 * user pastes a link a debounced preview loads; confirming fetches the image and
 * hands the resulting file back through `onPicked`. Cross-origin hosts that block
 * downloads surface a clear error. Rendered in a portal with a dimmed backdrop,
 * closing on Escape or backdrop click.
 *
 * @param props - Open state and the close / picked callbacks.
 * @returns The dialog element, or null when closed.
 */
export function UrlImageDialog({
  open,
  onClose,
  onPicked,
}: UrlImageDialogProps): ReactElement | null {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const onUrlChange = (value: string): void => {
    setUrl(value);
    setAddError(null);
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }
    const trimmed = value.trim();
    if (trimmed === "") {
      setPreview("");
      setStatus("idle");
      return;
    }
    setStatus("loading");
    debounceRef.current = setTimeout(() => setPreview(trimmed), 350);
  };

  if (!open) {
    return null;
  }

  const reset = (): void => {
    setUrl("");
    setPreview("");
    setStatus("idle");
    setAddError(null);
  };

  const close = (): void => {
    reset();
    onClose();
  };

  const onAdd = async (): Promise<void> => {
    if (status !== "ok") {
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const result = await importImageFromUrl(preview);
      if (!result.ok) {
        setAddError(result.error);
        return;
      }
      const blob = await (await fetch(result.dataUrl)).blob();
      onPicked(new File([blob], result.name, { type: blob.type }));
      reset();
    } catch {
      setAddError("Couldn't import this image. Try another link.");
    } finally {
      setAdding(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="url-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-bg p-6 shadow-pop"
      >
        <h2 id="url-dialog-title" className="text-xl font-bold text-ink">
          Save from URL
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Paste a link to an image from the web.</p>

        <div className="mt-4">
          <Input
            aria-label="Image URL"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://…"
            leadingIcon={<LinkIcon size={18} />}
            autoFocus
          />
        </div>

        <div className="mt-4">
          {preview === "" ? (
            <div className="grid aspect-[4/3] place-items-center rounded-xl bg-surface px-6 text-center text-sm text-ink-soft">
              A preview will appear here.
            </div>
          ) : (
            <div
              className={cn(
                "grid place-items-center overflow-hidden rounded-xl",
                status === "ok" ? "" : "aspect-[4/3] bg-surface",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                onLoad={() => setStatus("ok")}
                onError={() => setStatus("error")}
                className={
                  status === "ok"
                    ? "mx-auto block max-h-[50vh] w-auto max-w-full rounded-xl"
                    : "hidden"
                }
              />
              {status === "loading" ? (
                <span className="text-sm text-ink-soft">Loading…</span>
              ) : null}
              {status === "error" ? (
                <span className="px-6 text-center text-sm text-ink-soft">
                  Couldn&apos;t load an image from that link.
                </span>
              ) : null}
            </div>
          )}
        </div>

        {addError !== null ? (
          <p role="alert" className="mt-2 text-sm text-accent">
            {addError}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={adding}>
            Cancel
          </Button>
          <Button onClick={() => void onAdd()} disabled={status !== "ok"} loading={adding}>
            Add
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
