"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { IconButton, Spinner } from "@/components/ui";
import { CloseIcon } from "@/icons";
import { addableStories, addToHighlight } from "@/server/actions/highlights";
import type { Story } from "@/types/domain";

/**
 * Props for the {@link AddStoryToHighlightSheet} component.
 */
export type AddStoryToHighlightSheetProps = {
  highlightId: string;
  onClose: () => void;
};

/**
 * Owner-only picker listing the user's currently active stories that are not yet
 * in a highlight; tapping one adds it. The chosen story leaves the grid and the
 * profile refreshes. Rendered in a portal over a dimmed backdrop.
 *
 * @param props - The highlight id and the close handler.
 * @returns The picker modal, or null while its candidates load.
 */
export function AddStoryToHighlightSheet({
  highlightId,
  onClose,
}: AddStoryToHighlightSheetProps): ReactElement | null {
  const t = useTranslations("stories");
  const router = useRouter();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void addableStories(highlightId).then((result) => {
      if (active) {
        setStories(result);
      }
    });
    return () => {
      active = false;
    };
  }, [highlightId]);

  const add = (storyId: string): void => {
    setBusy(true);
    void addToHighlight(highlightId, storyId).then(() => {
      setStories((current) => (current ?? []).filter((story) => story.id !== storyId));
      setBusy(false);
      router.refresh();
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
          <h2 className="text-lg font-extrabold text-ink">{t("addStory")}</h2>
          <IconButton label={t("cancel")} tone="ghost" onClick={onClose}>
            <CloseIcon size={18} />
          </IconButton>
        </div>

        {stories.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">{t("noStoriesToAdd")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {stories.map((story) => (
              <button
                key={story.id}
                type="button"
                onClick={() => add(story.id)}
                disabled={busy}
                className="relative aspect-[9/16] overflow-hidden rounded-xl transition-transform active:scale-95"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={story.imageUrl} alt="" className="size-full object-cover" />
                {busy ? (
                  <span className="absolute inset-0 grid place-items-center bg-ink/30" />
                ) : null}
              </button>
            ))}
          </div>
        )}

        {busy ? (
          <div className="mt-3 grid place-items-center">
            <Spinner size={18} />
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
