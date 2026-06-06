"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ReactElement } from "react";
import { StackIcon } from "@/icons";
import { DURATION, REDUCED_MOTION, gsap, useGSAP } from "@/lib/gsap";
import type { BoardSummary } from "@/types/domain";

/**
 * Props for the {@link BoardsGrid} component.
 */
export type BoardsGridProps = {
  boards: BoardSummary[];
  emptyMessage?: string;
};

/**
 * Renders a board's cover as a collage: one large pin on the left and up to two
 * stacked on the right, filling the square tile. Missing slots stay empty and a
 * placeholder icon is shown when the board has no pins.
 *
 * @param props - The board's cover image URLs.
 * @param props.covers - Up to three cover image URLs.
 * @returns The collage element.
 */
function BoardCover({ covers }: { covers: string[] }): ReactElement {
  if (covers.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-2xl bg-surface text-ink-soft">
        <StackIcon size={28} />
      </div>
    );
  }
  const [main, ...rest] = covers;
  return (
    <div className="grid aspect-square grid-cols-3 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl bg-surface">
      <div className="relative col-span-2 row-span-2">
        <Image
          src={main ?? ""}
          alt=""
          fill
          sizes="(max-width: 768px) 34vw, 17vw"
          className="object-cover"
        />
      </div>
      {[0, 1].map((index) => {
        const url = rest[index];
        return (
          <div key={index} className="relative bg-surface-2">
            {url !== undefined ? (
              <Image
                src={url}
                alt=""
                fill
                sizes="(max-width: 768px) 17vw, 8vw"
                className="object-cover"
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Responsive grid of board cover cards with a staggered entrance animation.
 * Each card links to the board detail and shows a collage cover, the board name
 * and its pin count.
 *
 * @param props - The boards to display and an optional empty-state message.
 * @returns The boards grid, or an empty state when there are none.
 */
export function BoardsGrid({
  boards,
  emptyMessage = "No boards yet.",
}: BoardsGridProps): ReactElement {
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
    return <p className="py-16 text-center text-ink-soft">{emptyMessage}</p>;
  }

  return (
    <div ref={scope} className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {boards.map((board) => (
        <Link key={board.id} href={`/boards/${board.id}`} data-board-card className="group block">
          <div className="overflow-hidden rounded-2xl transition group-hover:opacity-95">
            <BoardCover covers={board.coverUrls} />
          </div>
          <p className="mt-2 font-semibold text-ink">{board.name}</p>
          <p className="text-sm text-ink-soft">
            {board.pinCount} {board.pinCount === 1 ? "Pin" : "Pins"}
          </p>
        </Link>
      ))}
    </div>
  );
}
