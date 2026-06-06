"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { useToast } from "@/components/ui";
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
 * Save control of the pin detail: a board selector (defaulting to Quick Saves)
 * and a Save button that adds the pin to the chosen board, confirming with a
 * toast.
 *
 * @param props - The pin identity and the user's boards.
 * @returns The save control element.
 */
export function SaveToBoard({ pinId, title, imageUrl, boards }: SaveToBoardProps): ReactElement {
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const defaultId = boards.find((board) => board.isDefault)?.id ?? boards[0]?.id ?? "";
  const [boardId, setBoardId] = useState(defaultId);

  const onSave = (): void => {
    if (boardId === "") {
      return;
    }
    const boardName = boards.find((board) => board.id === boardId)?.name ?? "board";
    startTransition(async () => {
      const result = await savePinToBoard(pinId, boardId);
      if (result.ok) {
        show({ title: `Saved to ${boardName}`, description: title, img: imageUrl });
      } else {
        show({ title: "Could not save", description: result.error });
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={boardId}
        onChange={(event) => setBoardId(event.target.value)}
        aria-label="Board"
        className="h-11 max-w-[160px] cursor-pointer rounded-full bg-surface px-4 text-[15px] font-semibold text-ink outline-none focus:bg-surface-2"
      >
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onSave}
        disabled={pending || boardId === ""}
        className="h-11 cursor-pointer rounded-full bg-accent px-5 text-[15px] font-semibold text-bg transition-colors duration-150 hover:bg-accent-press disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}
