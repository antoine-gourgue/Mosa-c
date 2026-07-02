"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, Input, Sheet } from "@/components/ui";
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
 * Sheet for creating a new board from the pin composer. Persists the board
 * through the create action and hands the new board back through `onCreated`.
 * Uses the shared {@link Sheet} primitive, so it is a bottom sheet on mobile and
 * a centered dialog on desktop.
 *
 * @param props - Open state and the close / created callbacks.
 * @returns The dialog element, or null when closed.
 */
export function CreateBoardDialog({
  open,
  onClose,
  onCreated,
}: CreateBoardDialogProps): ReactElement | null {
  const t = useTranslations("create");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        setError(t("createBoardFailed"));
      }
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title={t("createBoard")}>
      <Input
        label={t("name")}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onCreate();
          }
        }}
        placeholder={t("boardNamePlaceholder")}
        autoFocus
      />

      {error !== null ? (
        <p role="alert" className="mt-2 text-sm text-accent">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={pending}>
          {t("cancel")}
        </Button>
        <Button onClick={onCreate} disabled={name.trim() === ""} loading={pending}>
          {t("createAction")}
        </Button>
      </div>
    </Sheet>
  );
}
