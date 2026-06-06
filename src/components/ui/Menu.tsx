"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, MouseEvent, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton, type IconButtonTone } from "./IconButton";

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
  tone?: IconButtonTone;
};

/**
 * Accessible icon-triggered dropdown menu. The panel is rendered in a portal
 * with fixed positioning anchored to the trigger so it is never clipped by an
 * ancestor's `overflow: hidden`, and the trigger stops click propagation so the
 * menu can live inside a linked card without navigating. It closes on outside
 * click, Escape, scroll, resize or selection.
 *
 * @param props - The trigger label and icon plus the menu items.
 * @returns The menu element.
 */
export function Menu({
  label,
  icon,
  items,
  align = "end",
  tone = "ghost",
}: MenuProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((): void => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) !== true &&
        panelRef.current?.contains(target) !== true
      ) {
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
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    panelRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  const onTriggerClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    if (!open) {
      const rect = event.currentTarget.getBoundingClientRect();
      setPosition(
        align === "end"
          ? { top: rect.bottom + 8, right: window.innerWidth - rect.right }
          : { top: rect.bottom + 8, left: rect.left },
      );
    }
    setOpen((value) => !value);
  };

  return (
    <>
      <IconButton
        ref={triggerRef}
        label={label}
        tone={tone}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onTriggerClick}
      >
        {icon}
      </IconButton>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              role="menu"
              aria-label={label}
              style={{ position: "fixed", ...position }}
              className="z-[100] min-w-48 overflow-hidden rounded-2xl bg-bg p-1.5 shadow-pop"
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
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
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
