"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { ComposeIcon, ImageIcon, TrashIcon } from "@/icons";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link HighlightActionsSheet} component.
 */
export type HighlightActionsSheetProps = {
  title: string;
  onEdit: () => void;
  onAddStory: () => void;
  onDelete: () => void;
  onClose: () => void;
};

/**
 * Bottom sheet of actions for a profile highlight, opened by a long press on its
 * cover: edit (rename and content), add a story, or delete. Slides up over a
 * dimmed backdrop; tapping the backdrop closes it.
 *
 * @param props - The highlight title and the action handlers.
 * @returns The actions sheet.
 */
export function HighlightActionsSheet({
  title,
  onEdit,
  onAddStory,
  onDelete,
  onClose,
}: HighlightActionsSheetProps): ReactElement {
  const t = useTranslations("stories");
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rowClass = "flex w-full items-center gap-3 px-5 py-4 text-left text-[15px] font-semibold";

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[130] flex items-end bg-ink/40 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "w-full rounded-t-3xl bg-bg pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out",
          shown ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-surface-3" />
        <p className="truncate px-5 pb-2 pt-2 text-center text-sm font-bold text-ink">{title}</p>
        <button type="button" onClick={onEdit} className={cn(rowClass, "text-ink")}>
          <ComposeIcon size={18} className="text-ink-soft" />
          {t("edit")}
        </button>
        <button type="button" onClick={onAddStory} className={cn(rowClass, "text-ink")}>
          <ImageIcon size={18} className="text-ink-soft" />
          {t("addStory")}
        </button>
        <button type="button" onClick={onDelete} className={cn(rowClass, "text-accent")}>
          <TrashIcon size={18} />
          {t("deleteHighlight")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
