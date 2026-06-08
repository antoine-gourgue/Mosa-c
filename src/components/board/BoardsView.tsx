"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { Input } from "@/components/ui";
import { SearchIcon } from "@/icons";
import type { BoardSummary } from "@/types/domain";
import { BoardsGrid } from "./BoardsGrid";
import { CreateBoardButton } from "./CreateBoardButton";

/**
 * Props for the {@link BoardsView} component.
 */
export type BoardsViewProps = {
  boards: BoardSummary[];
};

/**
 * The "Your boards" page body: a banded header with the board count, a
 * client-side name filter and the create-board action, over a responsive grid
 * of board cards.
 *
 * @param props - The current user's boards.
 * @returns The boards view element.
 */
export function BoardsView({ boards }: BoardsViewProps): ReactElement {
  const [query, setQuery] = useState("");
  const trimmed = query.trim().toLowerCase();
  const filtered =
    trimmed === "" ? boards : boards.filter((board) => board.name.toLowerCase().includes(trimmed));

  return (
    <div>
      <header className="-mx-6 mb-8 border-y border-line px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Your boards</h1>
            <p className="mt-0.5 text-sm text-ink-soft">
              {boards.length} {boards.length === 1 ? "board" : "boards"}
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                aria-label="Search your boards"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your boards"
                leadingIcon={<SearchIcon size={18} />}
              />
            </div>
            <CreateBoardButton />
          </div>
        </div>
      </header>

      {trimmed !== "" && filtered.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">No boards match “{query}”.</p>
      ) : (
        <BoardsGrid
          boards={filtered}
          emptyMessage="No boards yet — save a pin or create one to start."
        />
      )}
    </div>
  );
}
