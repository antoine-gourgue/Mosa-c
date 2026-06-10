"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { PlusIcon } from "@/icons";
import { createBoard } from "@/server/actions/boards";
import { BoardFormDialog, type BoardFormValues } from "./BoardFormDialog";

/**
 * Button that opens a dialog to create a new board and navigates to it on
 * success.
 *
 * @returns The create-board control.
 */
export function CreateBoardButton(): ReactElement {
  const t = useTranslations("board");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (values: BoardFormValues): void => {
    setError(null);
    startTransition(async () => {
      try {
        const board = await createBoard(values.name, {
          secret: values.secret,
          description: values.description,
        });
        setOpen(false);
        router.push(`/boards/${board.id}`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t("createFailed"));
      }
    });
  };

  return (
    <>
      <Button leftIcon={<PlusIcon size={18} />} onClick={() => setOpen(true)}>
        {t("createBoard")}
      </Button>
      {open ? (
        <BoardFormDialog
          title={t("createBoard")}
          label={t("boardName")}
          submitLabel={t("create")}
          pending={pending}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
