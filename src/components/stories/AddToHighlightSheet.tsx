"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Button, Input, Spinner } from "@/components/ui";
import { PlusIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { addToHighlight, createStoryHighlight, myHighlights } from "@/server/actions/highlights";
import type { Highlight } from "@/types/domain";

/**
 * Props for the {@link AddToHighlightSheet} component.
 */
export type AddToHighlightSheetProps = {
  storyId: string;
  onClose: () => void;
  onDone: () => void;
};

/**
 * Bottom sheet (inside the story card) to add the current story to a highlight:
 * either pick an existing one or create a new one with a title (cover defaults
 * to the story poster). Calls `onDone` once added.
 *
 * @param props - The story id, the close handler and the done handler.
 * @returns The sheet element.
 */
export function AddToHighlightSheet({
  storyId,
  onClose,
  onDone,
}: AddToHighlightSheetProps): ReactElement {
  const t = useTranslations("stories");
  const [highlights, setHighlights] = useState<Highlight[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let active = true;
    void myHighlights().then((result) => {
      if (active) {
        setHighlights(result);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const addExisting = (id: string): void => {
    setBusy(true);
    void addToHighlight(id, storyId).then(onDone);
  };

  const create = (): void => {
    setBusy(true);
    void createStoryHighlight(storyId, title).then(onDone);
  };

  return (
    <div onClick={onClose} className="absolute inset-0 z-40 flex items-end bg-ink/40">
      <div
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "max-h-[80%] w-full overflow-y-auto rounded-t-2xl bg-bg p-4 transition-transform duration-200 ease-out",
          shown ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-3" />
        <h2 className="mb-3 text-center text-sm font-bold text-ink">{t("addToHighlight")}</h2>
        {creating ? (
          <div className="flex flex-col gap-3">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("highlightName")}
              aria-label={t("highlightName")}
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="ghost" fullWidth onClick={() => setCreating(false)}>
                {t("cancel")}
              </Button>
              <Button fullWidth loading={busy} disabled={title.trim() === ""} onClick={create}>
                {t("create")}
              </Button>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            <li>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-dashed border-line text-ink-soft">
                  <PlusIcon size={20} />
                </span>
                <span className="font-semibold text-ink">{t("newHighlight")}</span>
              </button>
            </li>
            {highlights === null ? (
              <li className="grid place-items-center py-6">
                <Spinner size={20} />
              </li>
            ) : (
              highlights.map((highlight) => (
                <li key={highlight.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => addExisting(highlight.id)}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface disabled:opacity-50"
                  >
                    <span className="size-11 shrink-0 overflow-hidden rounded-full bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={highlight.coverUrl} alt="" className="size-full object-cover" />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block truncate font-semibold text-ink">
                        {highlight.title}
                      </span>
                      <span className="block text-sm text-ink-soft">
                        {t("storyCount", { count: highlight.storyCount })}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
