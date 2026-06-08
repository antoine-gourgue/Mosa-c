"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { SmileIcon } from "@/icons";
import { toggleReaction } from "@/server/actions/comments";
import type { CommentReaction } from "@/types/domain";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

const PICKER_WIDTH = 300;
const PICKER_HEIGHT = 380;
const GAP = 6;

/**
 * Props for the {@link CommentReactions} component.
 */
export type CommentReactionsProps = {
  commentId: string;
  initialReactions: CommentReaction[];
  isAuthed: boolean;
};

/**
 * Computes a viewport-clamped fixed position for the emoji picker anchored to
 * the trigger button: below it when there is room, above it otherwise.
 *
 * @param anchor - The trigger button's bounding rectangle.
 * @returns The top/left coordinates for the fixed picker.
 */
function pickerPosition(anchor: DOMRect): { top: number; left: number } {
  let left = anchor.left;
  if (left + PICKER_WIDTH > window.innerWidth - 8) {
    left = window.innerWidth - PICKER_WIDTH - 8;
  }
  let top = anchor.bottom + GAP;
  if (top + PICKER_HEIGHT > window.innerHeight - 8) {
    top = anchor.top - PICKER_HEIGHT - GAP;
  }
  return { top: Math.max(8, top), left: Math.max(8, left) };
}

/**
 * Emoji reaction bar for a single comment: grouped reaction pills with counts
 * (the viewer's own reactions highlighted) and, for signed-in users, an emoji
 * picker to add a reaction. The picker renders in a portal with fixed
 * positioning so it is never clipped by the surrounding card. Toggling is
 * optimistic and reconciled with the server's authoritative aggregate.
 *
 * @param props - The comment id, its initial reactions and viewer auth state.
 * @returns The reaction bar element.
 */
export function CommentReactions({
  commentId,
  initialReactions,
  isAuthed,
}: CommentReactionsProps): ReactElement | null {
  const [reactions, setReactions] = useState(initialReactions);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const reposition = (): void => {
      const anchor = buttonRef.current?.getBoundingClientRect();
      if (anchor !== undefined) {
        setPosition(pickerPosition(anchor));
      }
    };
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) !== true &&
        popoverRef.current?.contains(target) !== true
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const onScroll = (event: Event): void => {
      if (popoverRef.current?.contains(event.target as Node) === true) {
        return;
      }
      reposition();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const togglePicker = (): void => {
    if (open) {
      setOpen(false);
      return;
    }
    const anchor = buttonRef.current?.getBoundingClientRect();
    if (anchor !== undefined) {
      setPosition(pickerPosition(anchor));
      setOpen(true);
    }
  };

  const react = (emoji: string): void => {
    setOpen(false);
    startTransition(async () => {
      const result = await toggleReaction(commentId, emoji);
      if (result.ok) {
        setReactions(result.reactions);
      }
    });
  };

  if (!isAuthed && reactions.length === 0) {
    return null;
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          disabled={!isAuthed}
          aria-pressed={reaction.reactedByViewer}
          onClick={() => react(reaction.emoji)}
          className={`flex h-7 cursor-pointer items-center gap-1 rounded-lg border px-2 text-[13px] leading-none transition-colors disabled:cursor-default ${
            reaction.reactedByViewer
              ? "border-accent/40 bg-accent/10 text-ink"
              : "border-line bg-surface text-ink-soft hover:bg-surface-2"
          }`}
        >
          <span className="text-[15px]">{reaction.emoji}</span>
          <span className="font-semibold tabular-nums">{reaction.count}</span>
        </button>
      ))}

      {isAuthed ? (
        <button
          ref={buttonRef}
          type="button"
          aria-label="Add a reaction"
          aria-expanded={open}
          onClick={togglePicker}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <SmileIcon size={16} />
        </button>
      ) : null}

      {open && position !== null
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[1000]"
              style={{ top: position.top, left: position.left }}
            >
              <EmojiPicker
                onEmojiClick={(data) => react(data.emoji)}
                width={PICKER_WIDTH}
                height={PICKER_HEIGHT}
                previewConfig={{ showPreview: false }}
                lazyLoadEmojis
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
