"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, Input, useToast } from "@/components/ui";
import { CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon } from "@/icons";
import { CreateBoardDialog } from "@/components/create/CreateBoardDialog";
import { savePinToBoard } from "@/server/actions/saves";

/**
 * A board option for the {@link SaveToBoard} selector.
 */
export type SaveBoardOption = {
  id: string;
  name: string;
  isDefault: boolean;
  coverUrl?: string | null;
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
 * Square board cover thumbnail, falling back to an empty tinted tile.
 *
 * @param props - The cover URL (or null) and the pixel size.
 * @returns The cover element.
 */
function Cover({ url, size }: { url: string | null; size: number }): ReactElement {
  return (
    <span
      className="shrink-0 overflow-hidden rounded-lg bg-surface-2"
      style={{ width: size, height: size }}
    >
      {url !== null ? (
        <Image src={url} alt="" width={size} height={size} className="h-full w-full object-cover" />
      ) : null}
    </span>
  );
}

/**
 * Primary save control of the pin detail: an accent Save button that adds the
 * pin to the active board, with an attached chevron opening the same rich board
 * dropdown used by the create flow — a searchable list of boards with covers and
 * a Create board shortcut. Picking a board makes it the active target and saves
 * immediately. Closes on outside click or Escape.
 *
 * @param props - The pin identity and the user's boards.
 * @returns The save control element.
 */
export function SaveToBoard({
  pinId,
  title,
  imageUrl,
  boards: initialBoards,
}: SaveToBoardProps): ReactElement {
  const tc = useTranslations("create");
  const tp = useTranslations("pin");
  const td = useTranslations("detail");
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [boards, setBoards] = useState(initialBoards);
  const defaultId = boards.find((board) => board.isDefault)?.id ?? boards[0]?.id ?? "";
  const [boardId, setBoardId] = useState(defaultId);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocPointerDown = (event: MouseEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const saveTo = (id: string): void => {
    if (id === "") {
      return;
    }
    const boardName = boards.find((board) => board.id === id)?.name ?? "board";
    setBoardId(id);
    startTransition(async () => {
      const result = await savePinToBoard(pinId, id);
      if (result.ok) {
        show({
          title: tp("savedToBoard", { board: boardName }),
          description: title,
          img: imageUrl,
        });
      } else {
        show({ title: td("couldNotSave"), description: result.error });
      }
    });
  };

  const filtered = boards.filter((board) =>
    board.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div ref={rootRef} className="relative flex items-center">
      <Button
        onClick={() => saveTo(boardId)}
        disabled={pending || boardId === ""}
        className="rounded-r-none"
      >
        {tp("save")}
      </Button>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={tc("chooseBoard")}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 cursor-pointer items-center rounded-r-xl border-l border-bg/30 bg-accent px-2.5 text-bg transition-colors duration-150 hover:bg-accent-press"
      >
        <ChevronDownIcon size={18} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-line bg-bg p-2 shadow-pop">
          <Input
            aria-label={tc("searchBoards")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tc("search")}
            leadingIcon={<SearchIcon size={18} />}
          />
          <p className="px-2 pb-1 pt-3 text-xs font-semibold text-ink-soft">{tc("allBoards")}</p>
          <ul className="max-h-60 overflow-auto">
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-sm text-ink-soft">{tc("noBoardsFound")}</li>
            ) : (
              filtered.map((board) => (
                <li key={board.id}>
                  <button
                    type="button"
                    onClick={() => {
                      saveTo(board.id);
                      setOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
                  >
                    <Cover url={board.coverUrl ?? null} size={40} />
                    <span className="flex-1 truncate text-[15px] font-semibold text-ink">
                      {board.name}
                    </span>
                    {board.id === boardId ? (
                      <CheckIcon size={18} className="shrink-0 text-ink" />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-bg">
              <PlusIcon size={20} />
            </span>
            <span className="text-[15px] font-semibold text-ink">{tc("createBoard")}</span>
          </button>
        </div>
      ) : null}

      <CreateBoardDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(board) => {
          setBoards((prev) => [
            ...prev,
            { id: board.id, name: board.name, isDefault: false, coverUrl: board.coverUrl },
          ]);
          setCreateOpen(false);
          saveTo(board.id);
        }}
      />
    </div>
  );
}
