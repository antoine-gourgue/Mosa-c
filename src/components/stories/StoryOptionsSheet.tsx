"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { StarIcon, TrashIcon } from "@/icons";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link StoryOptionsSheet} component.
 */
export type StoryOptionsSheetProps = {
  onAddToHighlight: () => void;
  onConfirmDelete: () => void;
  onClose: () => void;
};

/**
 * In-card bottom sheet of owner actions for a story: add it to a highlight or
 * delete it. Deleting asks for an inline confirmation within the same sheet so
 * it stays over the story (no portal). Slides up inside the story card; tapping
 * the dimmed area closes it.
 *
 * @param props - The add-to-highlight, confirmed-delete and close handlers.
 * @returns The options sheet.
 */
export function StoryOptionsSheet({
  onAddToHighlight,
  onConfirmDelete,
  onClose,
}: StoryOptionsSheetProps): ReactElement {
  const t = useTranslations("stories");
  const [shown, setShown] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rowClass = "flex w-full items-center gap-3 px-5 py-4 text-left text-[15px] font-semibold";

  return (
    <div onClick={onClose} className="absolute inset-0 z-40 flex items-end bg-ink/40">
      <div
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "w-full rounded-t-2xl bg-bg pb-2 transition-transform duration-200 ease-out",
          shown ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mb-1 mt-2 h-1 w-10 rounded-full bg-surface-3" />
        {confirming ? (
          <div className="px-5 pb-4 pt-3">
            <p className="text-center text-[15px] font-bold text-ink">{t("deleteStoryTitle")}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                {t("cancel")}
              </Button>
              <Button variant="accent" onClick={onConfirmDelete}>
                {t("delete")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <button type="button" onClick={onAddToHighlight} className={cn(rowClass, "text-ink")}>
              <StarIcon size={18} className="text-ink-soft" />
              {t("addToHighlight")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={cn(rowClass, "text-accent")}
            >
              <TrashIcon size={18} />
              {t("deleteStory")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
