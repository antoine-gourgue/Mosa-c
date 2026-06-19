"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Avatar, Spinner } from "@/components/ui";
import { HeartFilledIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { listStoryViewers } from "@/server/actions/stories";
import type { StoryViewerEntry } from "@/types/domain";

/**
 * Props for the {@link StoryViewersSheet} component.
 */
export type StoryViewersSheetProps = {
  storyId: string;
  onClose: () => void;
};

/**
 * Bottom sheet that slides up **within the story card** listing who viewed a
 * story, newest first, with a heart next to anyone who liked it. Only the
 * story's author gets data back. Tapping the dimmed area closes it. Rendered
 * absolutely inside the card (its parent must be positioned).
 *
 * @param props - The story id and the close handler.
 * @returns The viewers sheet element.
 */
export function StoryViewersSheet({ storyId, onClose }: StoryViewersSheetProps): ReactElement {
  const t = useTranslations("stories");
  const [viewers, setViewers] = useState<StoryViewerEntry[] | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    let active = true;
    void listStoryViewers(storyId).then((result) => {
      if (active) {
        setViewers(result);
      }
    });
    return () => {
      active = false;
    };
  }, [storyId]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div onClick={onClose} className="absolute inset-0 z-40 flex items-end bg-ink/40">
      <div
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "max-h-[75%] w-full overflow-y-auto rounded-t-2xl bg-bg p-4 transition-transform duration-200 ease-out",
          shown ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-3" />
        <h2 className="mb-3 text-center text-sm font-bold text-ink">
          {viewers === null ? t("viewers") : t("viewerCount", { count: viewers.length })}
        </h2>
        {viewers === null ? (
          <div className="grid place-items-center py-8">
            <Spinner size={22} />
          </div>
        ) : viewers.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">{t("noViewers")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {viewers.map(({ creator, liked }) => (
              <li
                key={creator.id}
                className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface"
              >
                <Link
                  href={creator.username !== null ? `/u/${creator.username}` : "#"}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar
                    src={creator.avatarUrl ?? undefined}
                    name={creator.name}
                    size={40}
                    verified={creator.verified}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{creator.name}</p>
                    {creator.username !== null ? (
                      <p className="truncate text-sm text-ink-soft">@{creator.username}</p>
                    ) : null}
                  </div>
                </Link>
                {liked ? <HeartFilledIcon size={18} className="shrink-0 text-accent" /> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
