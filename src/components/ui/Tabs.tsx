"use client";

import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A single tab descriptor for {@link Tabs}. Provide `href` for URL-driven tabs
 * (rendered as links) or omit it for in-page tabs (rendered as buttons that
 * call {@link TabsProps.onChange}).
 */
export type TabItem<K extends string = string> = {
  key: K;
  label: ReactNode;
  href?: string;
};

/**
 * Props for the {@link Tabs} component.
 */
export type TabsProps<K extends string = string> = {
  items: TabItem<K>[];
  active: K;
  onChange?: (key: K) => void;
  /** Accessible label for the tab bar. */
  ariaLabel: string;
  /** Horizontal alignment on desktop. Mobile always scrolls from the start. */
  align?: "start" | "center";
  className?: string;
};

/**
 * Shared horizontal tab bar used across the profile, settings and archive
 * screens. Renders link tabs (with `href`) or button tabs, marks the active one
 * with an underline pill and stays usable on mobile by scrolling horizontally
 * instead of wrapping or overflowing. Consolidates the previously duplicated
 * per-screen tab implementations onto one component.
 *
 * @param props - Tab items, the active key and change handling.
 * @returns The tab bar element.
 */
export function Tabs<K extends string = string>({
  items,
  active,
  onChange,
  ariaLabel,
  align = "center",
  className,
}: TabsProps<K>): ReactElement {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex gap-2 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        align === "center" ? "sm:justify-center" : "sm:justify-start",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.key === active;
        const content = (
          <>
            {item.label}
            {isActive ? (
              <span className="absolute inset-x-2 -bottom-px h-1 rounded-full bg-ink" />
            ) : null}
          </>
        );
        const classes = cn(
          "relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors",
          isActive ? "text-ink" : "text-ink-soft hover:text-ink",
        );
        if (item.href !== undefined) {
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={classes}
            >
              {content}
            </Link>
          );
        }
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(item.key)}
            className={cn(classes, "cursor-pointer")}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
