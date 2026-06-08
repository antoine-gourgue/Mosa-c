"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, Menu, useToast } from "@/components/ui";
import { CheckIcon, ChevronDownIcon } from "@/icons";
import { savePinToBoard } from "@/server/actions/saves";

/**
 * A board option for the {@link SaveToBoard} selector.
 */
export type SaveBoardOption = {
  id: string;
  name: string;
  isDefault: boolean;
};

/**
 * Props for the {@link SaveToBoard} component.
 */
export type SaveToBoardProps = {
  pinId: string;
  title: string;
  imageUrl: string;
  boards: SaveBoardOption[];
};

/**
 * Primary save control of the pin detail: a single accent Save button that adds
 * the pin to the active board (Quick Saves by default). When the user has more
 * than one board, an attached chevron opens a board menu; picking a board makes
 * it the active target and saves immediately, keeping the action row uncluttered.
 *
 * @param props - The pin identity and the user's boards.
 * @returns The save control element.
 */
export function SaveToBoard({ pinId, title, imageUrl, boards }: SaveToBoardProps): ReactElement {
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const defaultId = boards.find((board) => board.isDefault)?.id ?? boards[0]?.id ?? "";
  const [boardId, setBoardId] = useState(defaultId);
  const multi = boards.length > 1;

  const saveTo = (id: string): void => {
    if (id === "") {
      return;
    }
    const boardName = boards.find((board) => board.id === id)?.name ?? "board";
    setBoardId(id);
    startTransition(async () => {
      const result = await savePinToBoard(pinId, id);
      if (result.ok) {
        show({ title: `Saved to ${boardName}`, description: title, img: imageUrl });
      } else {
        show({ title: "Could not save", description: result.error });
      }
    });
  };

  return (
    <div className="flex items-center">
      <Button
        onClick={() => saveTo(boardId)}
        disabled={pending || boardId === ""}
        className={multi ? "rounded-r-none" : undefined}
      >
        Save
      </Button>
      {multi ? (
        <Menu
          label="Choose a board"
          align="end"
          items={boards.map((board) => ({
            label: board.name,
            icon: board.id === boardId ? <CheckIcon size={18} /> : undefined,
            onSelect: () => saveTo(board.id),
          }))}
          trigger={
            <span className="flex h-11 items-center rounded-r-xl border-l border-bg/30 bg-accent px-2.5 text-bg transition-colors duration-150 hover:bg-accent-press">
              <ChevronDownIcon size={18} />
            </span>
          }
        />
      ) : null}
    </div>
  );
}
