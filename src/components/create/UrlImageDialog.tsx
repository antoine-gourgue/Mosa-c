"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { ReactElement } from "react";
import { Button, Input, Sheet } from "@/components/ui";
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
 * downloads surface a clear error. Uses the shared {@link Sheet} primitive, so it
 * is a bottom sheet on mobile and a centered dialog on desktop.
 *
 * @param props - Open state and the close / picked callbacks.
 * @returns The dialog element, or null when closed.
 */
export function UrlImageDialog({
  open,
  onClose,
  onPicked,
}: UrlImageDialogProps): ReactElement | null {
  const t = useTranslations("create");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setAddError(t("urlImportFailed"));
    } finally {
      setAdding(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title={t("saveFromUrl")}>
      <p className="text-sm text-ink-soft">{t("urlDialogHint")}</p>

      <div className="mt-4">
        <Input
          aria-label={t("imageUrl")}
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
            {t("previewHint")}
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
              alt={t("preview")}
              onLoad={() => setStatus("ok")}
              onError={() => setStatus("error")}
              className={
                status === "ok"
                  ? "mx-auto block max-h-[50vh] w-auto max-w-full rounded-xl"
                  : "hidden"
              }
            />
            {status === "loading" ? (
              <span className="text-sm text-ink-soft">{t("loading")}</span>
            ) : null}
            {status === "error" ? (
              <span className="px-6 text-center text-sm text-ink-soft">
                {t("previewLoadFailed")}
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
          {t("cancel")}
        </Button>
        <Button onClick={() => void onAdd()} disabled={status !== "ok"} loading={adding}>
          {t("add")}
        </Button>
      </div>
    </Sheet>
  );
}
