"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { Button, IconButton, Input } from "@/components/ui";
import { CloseIcon } from "@/icons";
import {
  loadHighlight,
  removeFromHighlight,
  renameStoryHighlight,
} from "@/server/actions/highlights";
import type { Story } from "@/types/domain";

/**
 * Props for the {@link ManageHighlightSheet} component.
 */
export type ManageHighlightSheetProps = {
  highlightId: string;
  onClose: () => void;
};

/**
 * Owner-only modal to edit a profile story highlight: rename it, remove
 * individual stories (the highlight is deleted server-side once empty) or delete
 * it outright. Changes refresh the profile. Rendered in a portal over a dimmed
 * backdrop; closes on backdrop click or the close button.
 *
 * @param props - The highlight id and the close handler.
 * @returns The manage modal, or null while its stories load.
 */
export function ManageHighlightSheet({
  highlightId,
  onClose,
}: ManageHighlightSheetProps): ReactElement | null {
  const t = useTranslations("stories");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [stories, setStories] = useState<Story[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void loadHighlight(highlightId).then((detail) => {
      if (!active || detail === null) {
        return;
      }
      setTitle(detail.title);
      setStories(detail.stories);
    });
    return () => {
      active = false;
    };
  }, [highlightId]);

  const done = (): void => {
    router.refresh();
    onClose();
  };

  const saveTitle = (): void => {
    const next = title.trim();
    if (next.length === 0) {
      return;
    }
    setBusy(true);
    void renameStoryHighlight(highlightId, next).then(() => {
      setBusy(false);
      done();
    });
  };

  const removeStory = (storyId: string): void => {
    setBusy(true);
    void removeFromHighlight(highlightId, storyId).then(() => {
      const remaining = (stories ?? []).filter((story) => story.id !== storyId);
      setStories(remaining);
      setBusy(false);
      if (remaining.length === 0) {
        done();
      } else {
        router.refresh();
      }
    });
  };

  if (stories === null) {
    return null;
  }

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[130] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-bg p-5 shadow-pop"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">{t("editHighlight")}</h2>
          <IconButton label={t("cancel")} tone="ghost" onClick={onClose}>
            <CloseIcon size={18} />
          </IconButton>
        </div>

        <div className="flex items-end gap-2">
          <Input
            label={t("highlightName")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={40}
          />
          <Button variant="dark" onClick={saveTitle} disabled={busy || title.trim().length === 0}>
            {t("save")}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {stories.map((story) => (
            <div key={story.id} className="relative aspect-[9/16] overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.imageUrl} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label={t("removeFromHighlight")}
                onClick={() => removeStory(story.id)}
                disabled={busy}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink/70 text-bg"
              >
                <CloseIcon size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
