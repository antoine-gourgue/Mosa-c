"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";
import { Avatar } from "@/components/ui";
import { PlusIcon } from "@/icons";
import { cn } from "@/lib/cn";
import type { StoryReelItem } from "@/types/domain";
import { StoryViewer } from "./StoryViewer";

/**
 * The viewer's own identity, for the "Your story" ring.
 */
export type StoriesRailViewer = {
  id: string;
  name: string;
  avatarUrl: string | null;
  verified: boolean;
};

/**
 * Props for the {@link StoriesRail} component.
 */
export type StoriesRailProps = {
  reel: StoryReelItem[];
  viewer: StoriesRailViewer;
};

/**
 * A circular avatar with a story ring: a gradient ring when the viewer has an
 * unseen segment, a muted ring once everything is seen.
 *
 * @param props - The avatar data, ring state and click handler.
 * @returns The ring button.
 */
function StoryRing({
  name,
  label,
  avatarUrl,
  verified,
  hasUnseen,
  onClick,
}: {
  name: string;
  label: string;
  avatarUrl: string | null;
  verified: boolean;
  hasUnseen: boolean;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[72px] shrink-0 flex-col items-center gap-1"
    >
      <span
        className={cn(
          "grid place-items-center rounded-full p-[2.5px]",
          hasUnseen ? "bg-gradient-to-tr from-accent to-accent-press" : "bg-line",
        )}
      >
        <span className="grid place-items-center rounded-full bg-bg p-[2.5px]">
          <Avatar src={avatarUrl ?? undefined} name={name} size={56} verified={verified} />
        </span>
      </span>
      <span className="w-full truncate text-center text-xs text-ink-soft">{label}</span>
    </button>
  );
}

/**
 * The feed story rail: the viewer's own ring first (with an Add badge linking to
 * the create page), then followed authors with an active story — gradient ring
 * for unseen, muted for seen. Opening a ring launches the {@link StoryViewer}.
 * Horizontally scrollable.
 *
 * @param props - The grouped reel and the viewer identity.
 * @returns The story rail element.
 */
export function StoriesRail({ reel, viewer }: StoriesRailProps): ReactElement {
  const t = useTranslations("stories");
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const ownIndex = reel.findIndex((item) => item.author.id === viewer.id);
  const own = ownIndex >= 0 ? reel[ownIndex] : null;

  return (
    <div className="mb-5">
      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="flex w-[72px] shrink-0 flex-col items-center gap-1">
          <span className="relative inline-block">
            <button
              type="button"
              aria-label={own !== null ? t("yourStory") : t("addStory")}
              onClick={() =>
                own !== null ? setOpenIndex(ownIndex) : router.push("/stories/create")
              }
              className={cn(
                "grid place-items-center rounded-full p-[2.5px]",
                own?.hasUnseen === true
                  ? "bg-gradient-to-tr from-accent to-accent-press"
                  : "bg-line",
              )}
            >
              <span className="grid place-items-center rounded-full bg-bg p-[2.5px]">
                <Avatar src={viewer.avatarUrl ?? undefined} name={viewer.name} size={56} />
              </span>
            </button>
            <Link
              href="/stories/create"
              aria-label={t("addStory")}
              className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-bg bg-accent text-bg"
            >
              <PlusIcon size={12} />
            </Link>
          </span>
          <span className="w-full truncate text-center text-xs text-ink-soft">
            {t("yourStory")}
          </span>
        </div>

        {reel.map((item, index) =>
          item.author.id === viewer.id ? null : (
            <StoryRing
              key={item.author.id}
              name={item.author.name}
              label={item.author.name}
              avatarUrl={item.author.avatarUrl}
              verified={item.author.verified}
              hasUnseen={item.hasUnseen}
              onClick={() => setOpenIndex(index)}
            />
          ),
        )}
      </div>

      {openIndex !== null ? (
        <StoryViewer
          reel={reel}
          startIndex={openIndex}
          viewerId={viewer.id}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </div>
  );
}
