"use client";

import { useTranslations } from "next-intl";
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
  labelKey: "home" | "search" | "alerts" | "saves";
  icon: ReactNode;
  isActive: (pathname: string) => boolean;
  badge?: boolean;
};

/**
 * Floating bottom tab bar shown on mobile only (the desktop layout relies on
 * the top navigation). It exposes the primary destinations otherwise hidden on
 * small screens — Home, Search, Notifications and Saves — around a raised
 * central Create action, highlights the active route with an accent pill and
 * reserves the device safe-area inset.
 *
 * @param props - The unread notification count for the badge.
 * @returns The bottom navigation element.
 */
export function BottomNav({ unreadCount }: BottomNavProps): ReactElement {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: "/", labelKey: "home", icon: <HomeIcon size={23} />, isActive: (p) => p === "/" },
    {
      href: "/search",
      labelKey: "search",
      icon: <SearchIcon size={23} />,
      isActive: (p) => p.startsWith("/search"),
    },
    {
      href: "/notifications",
      labelKey: "alerts",
      icon: <BellIcon size={23} />,
      isActive: (p) => p.startsWith("/notifications"),
      badge: true,
    },
    {
      href: "/boards",
      labelKey: "saves",
      icon: <StackIcon size={23} />,
      isActive: (p) => p.startsWith("/boards"),
    },
  ];

  return (
    <nav
      aria-label={t("primary")}
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-50 sm:hidden"
    >
      <ul className="flex h-16 items-center justify-around rounded-[28px] border border-surface-2 bg-bg/85 px-1 shadow-pop backdrop-blur-xl">
        {tabs.slice(0, 2).map((tab) => (
          <NavTab key={tab.href} tab={tab} active={tab.isActive(pathname)} unread={unreadCount} />
        ))}
        <li className="flex flex-1 justify-center">
          <Link
            href="/create"
            aria-label={t("createPin")}
            className="grid size-12 -translate-y-3 place-items-center rounded-[18px] bg-accent text-bg shadow-pop transition duration-150 hover:bg-accent-press active:scale-95"
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
 * A single bottom-navigation tab: an icon in an accent pill when active, a small
 * label and an optional unread badge.
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
  const t = useTranslations("nav");
  const showBadge = tab.badge === true && unread > 0;
  const label = t(tab.labelKey);
  return (
    <li className="flex flex-1 justify-center">
      <Link
        href={tab.href}
        aria-current={active ? "page" : undefined}
        aria-label={showBadge ? t("tabUnread", { label, count: unread }) : label}
        className="flex flex-col items-center gap-0.5 py-1.5"
      >
        <span
          className={cn(
            "relative grid size-9 place-items-center transition-colors",
            active ? "text-accent" : "text-ink-soft",
          )}
        >
          {tab.icon}
          {showBadge ? (
            <span className="absolute right-1 top-1 size-2 rounded-full bg-accent ring-2 ring-bg" />
          ) : null}
        </span>
        <span
          className={cn(
            "text-[10px] font-semibold tracking-tight transition-colors",
            active ? "text-accent" : "text-ink-faint",
          )}
        >
          {label}
        </span>
      </Link>
    </li>
  );
}
