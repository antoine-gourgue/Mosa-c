import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { StackIcon } from "@/icons";
import type { BoardSummary } from "@/types/domain";

/**
 * Props for the {@link BoardsGrid} component.
 */
export type BoardsGridProps = {
  boards: BoardSummary[];
  emptyMessage?: string;
};

/**
 * Responsive grid of board cover cards. Each card links to the board detail and
 * shows the cover image (or a placeholder), the board name and its pin count.
 *
 * @param props - The boards to display and an optional empty-state message.
 * @returns The boards grid, or an empty state when there are none.
 */
export function BoardsGrid({
  boards,
  emptyMessage = "No boards yet.",
}: BoardsGridProps): ReactElement {
  if (boards.length === 0) {
    return <p className="py-16 text-center text-ink-soft">{emptyMessage}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {boards.map((board) => (
        <Link key={board.id} href={`/boards/${board.id}`} className="group block">
          <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-surface">
            {board.coverUrl !== null ? (
              <Image
                src={board.coverUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <StackIcon size={28} />
            )}
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
