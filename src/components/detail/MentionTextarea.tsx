"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import { Avatar } from "@/components/ui";
import { searchMentions } from "@/server/actions/comments";
import type { MentionSuggestion } from "@/types/domain";

/**
 * Props for the {@link MentionTextarea} component.
 */
export type MentionTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  ariaLabel: string;
  placeholder: string;
  className: string;
  rows?: number;
  autoFocus?: boolean;
};

type MentionToken = {
  start: number;
  query: string;
};

/**
 * Finds the @mention token being typed immediately before the caret, if any. A
 * token is a run of mention characters preceded by an "@" that itself sits at
 * the start of the text or after whitespace.
 *
 * @param value - The full textarea value.
 * @param caret - The current caret position.
 * @returns The mention token, or null when the caret is not in one.
 */
function findMentionToken(value: string, caret: number): MentionToken | null {
  let index = caret;
  while (index > 0 && /[a-zA-Z0-9_]/.test(value[index - 1] ?? "")) {
    index -= 1;
  }
  if (value[index - 1] !== "@") {
    return null;
  }
  const before = value[index - 2];
  if (before !== undefined && !/\s/.test(before)) {
    return null;
  }
  return { start: index - 1, query: value.slice(index, caret) };
}

/**
 * A comment composer textarea with @mention autocomplete. Typing "@" opens a
 * dropdown of matching users; selecting one (by click, Enter or Tab) inserts
 * their handle. Enter submits the comment when the dropdown is closed, while
 * Shift+Enter always inserts a newline.
 *
 * @param props - The controlled value, change/submit handlers and presentation.
 * @returns The mention-aware textarea element.
 */
export function MentionTextarea({
  value,
  onChange,
  onSubmit,
  ariaLabel,
  placeholder,
  className,
  rows = 1,
  autoFocus = false,
}: MentionTextareaProps): ReactElement {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tokenRef = useRef<MentionToken | null>(null);
  const caretRef = useRef<number | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (caretRef.current !== null && textareaRef.current !== null) {
      const caret = caretRef.current;
      caretRef.current = null;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(caret, caret);
    }
  }, [value]);

  const closeMenu = (): void => {
    tokenRef.current = null;
    setOpen(false);
    setSuggestions([]);
    setActiveIndex(0);
  };

  const runSearch = (token: MentionToken): void => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    void searchMentions(token.query).then((results) => {
      if (requestRef.current !== requestId || tokenRef.current === null) {
        return;
      }
      setSuggestions(results);
      setActiveIndex(0);
      setOpen(results.length > 0);
    });
  };

  const handleChange = (next: string, caret: number): void => {
    onChange(next);
    const token = findMentionToken(next, caret);
    tokenRef.current = token;
    if (token === null) {
      closeMenu();
      return;
    }
    runSearch(token);
  };

  const select = (user: MentionSuggestion): void => {
    const token = tokenRef.current;
    const textarea = textareaRef.current;
    if (token === null || textarea === null) {
      return;
    }
    const caret = textarea.selectionStart;
    const inserted = `@${user.username} `;
    const next = value.slice(0, token.start) + inserted + value.slice(caret);
    caretRef.current = token.start + inserted.length;
    closeMenu();
    onChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (open && suggestions.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % suggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const user = suggestions[activeIndex];
        if (user !== undefined) {
          select(user);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => handleChange(event.target.value, event.target.selectionStart)}
        onKeyDown={onKeyDown}
        onBlur={() => window.setTimeout(closeMenu, 120)}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={className}
      />
      {open ? (
        <ul className="absolute bottom-full left-0 z-50 mb-2 max-h-64 w-72 overflow-auto rounded-2xl border border-line bg-surface py-1.5 shadow-lg">
          {suggestions.map((user, index) => (
            <li key={user.id}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  select(user);
                }}
                className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  index === activeIndex ? "bg-surface-2" : "hover:bg-surface-2"
                }`}
              >
                <Avatar src={user.avatarUrl ?? undefined} name={user.name} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">@{user.username}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
