"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { PlusIcon } from "@/icons";
import { createBoard } from "@/server/actions/boards";
import { BoardFormDialog } from "./BoardFormDialog";

/**
 * Button that opens a dialog to create a new board and navigates to it on
 * success.
 *
 * @returns The create-board control.
 */
export function CreateBoardButton(): ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (name: string): void => {
    setError(null);
    startTransition(async () => {
      try {
        const board = await createBoard(name);
        setOpen(false);
        router.push(`/boards/${board.id}`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not create the board.");
      }
    });
  };

  return (
    <>
      <Button leftIcon={<PlusIcon size={18} />} onClick={() => setOpen(true)}>
        Create board
      </Button>
      {open ? (
        <BoardFormDialog
          title="Create board"
          label="Board name"
          submitLabel="Create"
          pending={pending}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
