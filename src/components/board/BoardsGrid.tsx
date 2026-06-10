"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ReactElement } from "react";
import { LockIcon, StackIcon } from "@/icons";
import { DURATION, REDUCED_MOTION, gsap, useGSAP } from "@/lib/gsap";
import type { BoardSummary } from "@/types/domain";

/**
 * Props for the {@link BoardsGrid} component.
 */
export type BoardsGridProps = {
  boards: BoardSummary[];
  emptyMessage?: string;
};

const COVER_SIZES =
  "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw";

/**
 * Renders a board's cover, adapting to how many pins it has: a placeholder when
 * empty, a single image for one pin, two halves for two, and a one-large /
 * two-stacked collage for three or more — so a cover never shows an empty slot.
 *
 * @param props - The board's cover image URLs (newest first).
 * @returns The cover element.
 */
function BoardCover({ covers }: { covers: string[] }): ReactElement {
  if (covers.length === 0) {
    return (
      <div className="grid aspect-square place-items-center bg-surface text-ink-soft">
        <StackIcon size={30} />
      </div>
    );
  }

  if (covers.length === 1) {
    return (
      <div className="relative aspect-square bg-surface">
        <Image src={covers[0] ?? ""} alt="" fill sizes={COVER_SIZES} className="object-cover" />
      </div>
    );
  }

  if (covers.length === 2) {
    return (
      <div className="grid aspect-square grid-cols-2 gap-0.5 bg-surface">
        {covers.slice(0, 2).map((url, index) => (
          <div key={index} className="relative">
            <Image src={url} alt="" fill sizes={COVER_SIZES} className="object-cover" />
          </div>
        ))}
      </div>
    );
  }

  const [main, ...rest] = covers;
  return (
    <div className="grid aspect-square grid-cols-3 grid-rows-2 gap-0.5 bg-surface">
      <div className="relative col-span-2 row-span-2">
        <Image src={main ?? ""} alt="" fill sizes={COVER_SIZES} className="object-cover" />
      </div>
      {rest.slice(0, 2).map((url, index) => (
        <div key={index} className="relative bg-surface-2">
          <Image src={url} alt="" fill sizes={COVER_SIZES} className="object-cover" />
        </div>
      ))}
    </div>
  );
}

/**
 * Responsive grid of board cover cards with a staggered entrance animation. Each
 * card links to the board detail and shows an adaptive collage cover with a
 * subtle hover overlay, the board name and its pin count.
 *
 * @param props - The boards to display and an optional empty-state message.
 * @returns The boards grid, or an empty state when there are none.
 */
export function BoardsGrid({ boards, emptyMessage }: BoardsGridProps): ReactElement {
  const t = useTranslations("board");
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(`not all and ${REDUCED_MOTION}`, () => {
        gsap.from("[data-board-card]", {
          y: 16,
          opacity: 0,
          duration: DURATION.base,
          stagger: 0.04,
          ease: "power2.out",
        });
      });
    },
    { scope, dependencies: [boards.length] },
  );

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-6 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-soft">
          <StackIcon size={26} />
        </span>
        <p className="text-lg font-semibold text-ink">{emptyMessage ?? t("noBoards")}</p>
      </div>
    );
  }

  return (
    <div
      ref={scope}
      className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      {boards.map((board) => (
        <Link key={board.id} href={`/boards/${board.id}`} data-board-card className="group block">
          <div className="relative overflow-hidden rounded-pin">
            <BoardCover covers={board.coverUrls} />
            <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-150 group-hover:bg-ink/[0.06]" />
            {board.visibility === "SECRET" ? (
              <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-lg bg-ink/60 text-bg backdrop-blur">
                <LockIcon size={15} />
              </span>
            ) : null}
          </div>
          <p className="mt-2 flex items-center gap-1.5 truncate font-semibold text-ink group-hover:underline">
            {board.visibility === "SECRET" ? <LockIcon size={14} className="shrink-0" /> : null}
            {board.name}
          </p>
          <p className="text-sm text-ink-soft">{t("pinCount", { count: board.pinCount })}</p>
        </Link>
      ))}
    </div>
  );
}
