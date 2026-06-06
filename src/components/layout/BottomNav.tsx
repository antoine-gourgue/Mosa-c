"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { BellIcon, HomeIcon, PlusIcon, SearchIcon, StackIcon } from "@/icons";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link BottomNav} component.
 */
export type BottomNavProps = {
  unreadCount: number;
};

/**
 * A single tab in the {@link BottomNav}.
 */
type Tab = {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: (pathname: string) => boolean;
  badge?: boolean;
};

/**
 * Fixed bottom tab bar shown on mobile only (the desktop layout relies on the
 * top navigation). It exposes the primary destinations that are otherwise
 * hidden on small screens — Home, Search, Notifications and Saves — plus a
 * prominent central Create action, and reserves the device safe-area inset.
 *
 * @param props - The unread notification count for the badge.
 * @returns The bottom navigation element.
 */
export function BottomNav({ unreadCount }: BottomNavProps): ReactElement {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: "/", label: "Home", icon: <HomeIcon size={24} />, isActive: (p) => p === "/" },
    {
      href: "/search",
      label: "Search",
      icon: <SearchIcon size={24} />,
      isActive: (p) => p.startsWith("/search"),
    },
    {
      href: "/notifications",
      label: "Alerts",
      icon: <BellIcon size={24} />,
      isActive: (p) => p.startsWith("/notifications"),
      badge: true,
    },
    {
      href: "/boards",
      label: "Saves",
      icon: <StackIcon size={24} />,
      isActive: (p) => p.startsWith("/boards"),
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-surface-2 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <ul className="flex h-16 items-stretch justify-around">
        {tabs.slice(0, 2).map((tab) => (
          <NavTab key={tab.href} tab={tab} active={tab.isActive(pathname)} unread={unreadCount} />
        ))}
        <li className="flex items-center">
          <Link
            href="/create"
            aria-label="Create Pin"
            className="grid size-12 place-items-center rounded-full bg-accent text-bg shadow-pop transition duration-150 hover:bg-accent-press active:scale-95"
          >
            <PlusIcon size={26} />
          </Link>
        </li>
        {tabs.slice(2).map((tab) => (
          <NavTab key={tab.href} tab={tab} active={tab.isActive(pathname)} unread={unreadCount} />
        ))}
      </ul>
    </nav>
  );
}

/**
 * A single bottom-navigation tab rendering an icon, a small label and an
 * optional unread badge, with an active-state highlight.
 *
 * @param props - The tab descriptor, its active state and the unread count.
 * @param props.tab - The tab to render.
 * @param props.active - Whether the tab matches the current route.
 * @param props.unread - The unread notification count used by the badge.
 * @returns The tab list item.
 */
function NavTab({
  tab,
  active,
  unread,
}: {
  tab: Tab;
  active: boolean;
  unread: number;
}): ReactElement {
  const showBadge = tab.badge === true && unread > 0;
  return (
    <li className="flex flex-1">
      <Link
        href={tab.href}
        aria-current={active ? "page" : undefined}
        aria-label={showBadge ? `${tab.label}, ${unread} unread` : tab.label}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
          active ? "text-ink" : "text-ink-soft",
        )}
      >
        <span className="relative">
          {tab.icon}
          {showBadge ? (
            <span className="absolute -right-1 -top-0.5 size-2 rounded-full bg-accent" />
          ) : null}
        </span>
        {tab.label}
      </Link>
    </li>
  );
}
