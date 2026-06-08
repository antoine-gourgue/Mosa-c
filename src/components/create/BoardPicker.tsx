"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Input } from "@/components/ui";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "@/icons";
import { CreateBoardDialog } from "./CreateBoardDialog";

/**
 * A board option for the create form's board picker.
 */
export type BoardOption = {
  id: string;
  name: string;
  coverUrl: string | null;
};

/**
 * Props for the {@link BoardPicker} component.
 */
export type BoardPickerProps = {
  boards: BoardOption[];
  value: string;
  onChange: (name: string) => void;
  onCreated: (board: BoardOption) => void;
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
 * Pinterest-style board selector: a filled field showing the chosen board's
 * cover and name that opens a dropdown to search boards, pick one, or create a
 * new board through {@link CreateBoardDialog}. Closes on outside click or
 * Escape.
 *
 * @param props - The boards, the selected board name and the change / created
 *   callbacks.
 * @returns The board picker element.
 */
export function BoardPicker({
  boards,
  value,
  onChange,
  onCreated,
}: BoardPickerProps): ReactElement {
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

  const selected = boards.find((board) => board.name === value) ?? null;
  const filtered = boards.filter((board) =>
    board.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-14 w-full cursor-pointer items-center gap-3 rounded-xl bg-surface px-3 text-left transition-colors hover:bg-surface-2"
      >
        <Cover url={selected?.coverUrl ?? null} size={36} />
        <span className="flex-1 truncate text-[15px] font-semibold text-ink">
          {selected?.name ?? "Choose a board"}
        </span>
        <ChevronDownIcon size={18} className="shrink-0 text-ink-soft" />
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-line bg-bg p-2 shadow-pop">
          <Input
            aria-label="Search boards"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            leadingIcon={<SearchIcon size={18} />}
          />
          <p className="px-2 pb-1 pt-3 text-xs font-semibold text-ink-soft">All boards</p>
          <ul className="max-h-60 overflow-auto">
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-sm text-ink-soft">No boards found.</li>
            ) : (
              filtered.map((board) => (
                <li key={board.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(board.name);
                      setOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface"
                  >
                    <Cover url={board.coverUrl} size={40} />
                    <span className="truncate text-[15px] font-semibold text-ink">
                      {board.name}
                    </span>
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
            <span className="text-[15px] font-semibold text-ink">Create board</span>
          </button>
        </div>
      ) : null}

      <CreateBoardDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(board) => {
          onCreated(board);
          onChange(board.name);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}
