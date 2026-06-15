"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { CloseIcon } from "@/icons";
import { generatePinImage } from "@/server/actions/ai";

/**
 * Props for the {@link GenerateImageDialog} component.
 */
export type GenerateImageDialogProps = {
  open: boolean;
  onClose: () => void;
  onPicked: (file: File) => void;
};

/**
 * Modal for creating a pin image from a text prompt. Typing a prompt and
 * generating shows a preview and the remaining daily allowance; confirming turns
 * the generated image into a file and hands it back through `onPicked`. Rendered
 * in a portal with a dimmed backdrop, closing on Escape or backdrop click. A
 * short helper nudges French users to write their prompt in English, where the
 * model performs best.
 *
 * @param props - Open state and the close / picked callbacks.
 * @returns The dialog element, or null when closed.
 */
export function GenerateImageDialog({
  open,
  onClose,
  onPicked,
}: GenerateImageDialogProps): ReactElement | null {
  const t = useTranslations("create");
  const locale = useLocale();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (!open) {
    return null;
  }

  const reset = (): void => {
    setPrompt("");
    setDataUrl(null);
    setRemaining(null);
    setError(null);
  };

  const close = (): void => {
    reset();
    onClose();
  };

  const onGenerate = (): void => {
    if (prompt.trim() === "" || generating) {
      return;
    }
    setGenerating(true);
    setError(null);
    void generatePinImage(prompt)
      .then((result) => {
        if (result.ok) {
          setDataUrl(result.dataUrl);
          setRemaining(result.remaining);
        } else {
          setError(result.error);
        }
      })
      .catch(() => setError(t("publishFailed")))
      .finally(() => setGenerating(false));
  };

  const onUse = async (): Promise<void> => {
    if (dataUrl === null) {
      return;
    }
    const blob = await (await fetch(dataUrl)).blob();
    onPicked(new File([blob], "ai-pin.png", { type: blob.type || "image/png" }));
    reset();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-bg p-6 shadow-pop"
      >
        <button
          type="button"
          aria-label={t("cancel")}
          onClick={close}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
        >
          <CloseIcon size={18} />
        </button>

        <h2 id="generate-dialog-title" className="pr-8 text-xl font-bold text-ink">
          {t("generateTitle")}
        </h2>
        <p className="mt-1 pr-8 text-sm text-ink-soft">{t("generateHint")}</p>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={t("generatePlaceholder")}
          rows={3}
          autoFocus
          className="mt-4 w-full resize-none rounded-xl bg-surface px-4 py-3 text-[15px] text-ink outline-none ring-1 ring-transparent transition placeholder:text-ink-faint focus:bg-surface-2 focus:ring-line"
        />
        {locale === "fr" ? (
          <p className="mt-2 text-xs text-ink-soft">{t("promptEnglishHint")}</p>
        ) : null}

        {generating || dataUrl !== null ? (
          <div className="mx-auto mt-4 aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
            {generating ? (
              <div className="size-full animate-pulse bg-gradient-to-br from-surface to-surface-2" />
            ) : dataUrl !== null ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt={t("preview")} className="size-full object-cover" />
            ) : null}
          </div>
        ) : null}

        {remaining !== null ? (
          <p className="mt-3 text-xs text-ink-soft">
            {t("generateRemaining", { count: remaining })}
          </p>
        ) : null}
        {error !== null ? (
          <p role="alert" className="mt-3 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant={dataUrl === null ? "accent" : "ghost"}
            onClick={onGenerate}
            loading={generating}
            disabled={prompt.trim() === ""}
          >
            {dataUrl === null ? t("generate") : t("regenerate")}
          </Button>
          {dataUrl !== null ? (
            <Button onClick={() => void onUse()}>{t("useThisImage")}</Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
