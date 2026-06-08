"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactElement } from "react";
import { useMessagesUnread } from "@/components/messages";
import type { IconProps } from "@/icons";
import {
  BellFilledIcon,
  BellIcon,
  CommentFilledIcon,
  CommentIcon,
  GearFilledIcon,
  GearIcon,
  HomeFilledIcon,
  HomeIcon,
  Logo,
  PlusIcon,
  StackIcon,
} from "@/icons";
import { cn } from "@/lib/cn";
import { useNavPanel } from "./NavPanelProvider";

/**
 * Props for the {@link SideNav} component.
 */
export type SideNavProps = {
  unreadCount: number;
};

type Item = {
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
  IconActive?: ComponentType<IconProps>;
  isActive: (pathname: string) => boolean;
  badge?: "notifications" | "messages";
};

const ITEMS: Item[] = [
  {
    href: "/",
    label: "Home",
    Icon: HomeIcon,
    IconActive: HomeFilledIcon,
    isActive: (p) => p === "/",
  },
  { href: "/boards", label: "Saves", Icon: StackIcon, isActive: (p) => p.startsWith("/boards") },
  { href: "/create", label: "Create", Icon: PlusIcon, isActive: (p) => p.startsWith("/create") },
  {
    href: "/notifications",
    label: "Notifications",
    Icon: BellIcon,
    IconActive: BellFilledIcon,
    isActive: (p) => p.startsWith("/notifications"),
    badge: "notifications",
  },
  {
    href: "/messages",
    label: "Messages",
    Icon: CommentIcon,
    IconActive: CommentFilledIcon,
    isActive: (p) => p.startsWith("/messages"),
    badge: "messages",
  },
];

/**
 * Dark hover tooltip shown to the right of a rail item. Hidden by default and
 * revealed on hover of the parent `group` item; presentational only, since each
 * item already carries an `aria-label`.
 *
 * @param props - The tooltip label.
 * @returns The tooltip element.
 */
function RailTooltip({ label }: { label: string }): ReactElement {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 scale-95 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-sm font-semibold text-bg opacity-0 shadow-pop transition duration-150 group-hover:scale-100 group-hover:opacity-100 motion-reduce:scale-100 motion-reduce:transition-none"
    >
      {label}
    </span>
  );
}

/**
 * Pinterest-style left navigation rail, shown from the `sm` breakpoint up (the
 * top bar and bottom bar cover mobile). The brand sits at the top, icon-only
 * destinations with an active highlight and unread badges in the middle, and
 * Settings pinned to the bottom.
 *
 * @param props - The unread notification count for the bell badge.
 * @returns The side navigation rail.
 */
export function SideNav({ unreadCount }: SideNavProps): ReactElement {
  const pathname = usePathname();
  const { unreadCount: unreadMessages } = useMessagesUnread();
  const { activePanel, toggle, close } = useNavPanel();

  const hasBadge = (item: Item): boolean =>
    item.badge === "notifications"
      ? unreadCount > 0
      : item.badge === "messages"
        ? unreadMessages > 0
        : false;

  const panelIsOpen = activePanel !== null;
  const settingsActive = !panelIsOpen && pathname.startsWith("/settings");
  const itemClass = (active: boolean): string =>
    cn(
      "group relative grid size-12 place-items-center rounded-xl transition-colors hover:bg-surface",
      active ? "text-ink" : "text-ink/70 hover:text-ink",
    );

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 top-0 z-50 hidden w-16 flex-col items-center gap-4 border-r border-line bg-bg py-3 sm:flex"
    >
      <Link
        href="/"
        aria-label="Mosaic home"
        onClick={close}
        className="mb-1 grid size-12 place-items-center"
      >
        <span className="text-accent">
          <Logo size={32} />
        </span>
      </Link>

      {ITEMS.map((item) => {
        const badge = hasBadge(item) ? (
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent ring-2 ring-bg" />
        ) : null;
        const panel =
          item.badge === "messages"
            ? "messages"
            : item.badge === "notifications"
              ? "notifications"
              : null;
        if (panel !== null) {
          const panelActive = activePanel === panel;
          const Glyph = panelActive && item.IconActive !== undefined ? item.IconActive : item.Icon;
          return (
            <button
              key={item.href}
              type="button"
              aria-label={item.label}
              aria-current={panelActive ? "page" : undefined}
              onClick={() => toggle(panel)}
              className={cn("cursor-pointer", itemClass(panelActive))}
            >
              <Glyph size={28} />
              {badge}
              <RailTooltip label={item.label} />
            </button>
          );
        }
        const active = !panelIsOpen && item.isActive(pathname);
        const Glyph = active && item.IconActive !== undefined ? item.IconActive : item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            onClick={close}
            className={itemClass(active)}
          >
            <Glyph size={28} />
            {badge}
            <RailTooltip label={item.label} />
          </Link>
        );
      })}

      <Link
        href="/settings/profile"
        aria-label="Settings"
        onClick={close}
        aria-current={settingsActive ? "page" : undefined}
        className={cn("mt-auto", itemClass(settingsActive))}
      >
        {settingsActive ? <GearFilledIcon size={26} /> : <GearIcon size={26} />}
        <RailTooltip label="Settings" />
      </Link>
    </nav>
  );
}
