"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

/**
 * A single selectable entry in a {@link Menu}.
 */
export type MenuItem = {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
};

/**
 * Props for the {@link Menu} component.
 */
export type MenuProps = {
  label: string;
  icon: ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
};

/**
 * Accessible icon-triggered dropdown menu. Opens a list of actions below the
 * trigger, closes on outside click, Escape or selection, and moves focus to the
 * first item on open. Built on {@link IconButton} so it matches the action rows
 * it lives in.
 *
 * @param props - The trigger label and icon plus the menu items.
 * @returns The menu element.
 */
export function Menu({ label, icon, items, align = "end" }: MenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((): void => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent): void => {
      if (containerRef.current !== null && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    firstItemRef.current?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {icon}
      </IconButton>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            "absolute z-50 mt-2 min-w-48 overflow-hidden rounded-2xl bg-bg p-1.5 shadow-pop",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, index) => (
            <button
              key={item.label}
              ref={index === 0 ? firstItemRef : undefined}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium transition-colors hover:bg-surface",
                item.destructive ? "text-accent" : "text-ink",
              )}
            >
              {item.icon !== undefined ? (
                <span className="shrink-0 text-ink-soft">{item.icon}</span>
              ) : null}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
