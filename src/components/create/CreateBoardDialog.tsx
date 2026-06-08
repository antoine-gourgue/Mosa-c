"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { Button, Input } from "@/components/ui";
import { createBoard } from "@/server/actions/boards";
import type { BoardOption } from "./BoardPicker";

/**
 * Props for the {@link CreateBoardDialog} component.
 */
export type CreateBoardDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (board: BoardOption) => void;
};

/**
 * Modal for creating a new board from the pin composer. Persists the board
 * through the create action and hands the new board back through `onCreated`.
 * Rendered in a portal with a dimmed backdrop, closing on Escape or backdrop
 * click.
 *
 * @param props - Open state and the close / created callbacks.
 * @returns The dialog element, or null when closed.
 */
export function CreateBoardDialog({
  open,
  onClose,
  onCreated,
}: CreateBoardDialogProps): ReactElement | null {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const onCreate = (): void => {
    const trimmed = name.trim();
    if (trimmed === "") {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const board = await createBoard(trimmed);
        onCreated({ id: board.id, name: board.name, coverUrl: null });
        setName("");
      } catch {
        setError("Couldn't create this board. Try a different name.");
      }
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-board-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-bg p-6 shadow-pop"
      >
        <h2 id="create-board-title" className="text-center text-2xl font-bold text-ink">
          Create board
        </h2>

        <div className="mt-6">
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onCreate();
              }
            }}
            placeholder='Like "Places to Go" or "Recipes to Try"'
            autoFocus
          />
        </div>

        {error !== null ? (
          <p role="alert" className="mt-2 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={name.trim() === ""} loading={pending}>
            Create
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
