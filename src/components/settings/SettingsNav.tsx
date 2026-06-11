"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * The settings tabs, in display order, each mapped to its route and label key.
 */
const TABS = [
  { href: "/settings/profile", key: "tabProfile" },
  { href: "/settings/interests", key: "tabInterests" },
  { href: "/settings/notifications", key: "tabNotifications" },
  { href: "/settings/privacy", key: "tabPrivacy" },
  { href: "/settings/account", key: "tabAccount" },
] as const;

/**
 * Tab navigation for the settings hub: a vertical list of links on desktop that
 * highlights the active section, and a horizontal scrollable bar on mobile.
 *
 * @returns The settings navigation element.
 */
export function SettingsNav(): ReactElement {
  const t = useTranslations("settings");
  const pathname = usePathname();

  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:gap-1 md:px-0 md:pb-0">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-xl px-4 py-2.5 text-[15px] font-semibold transition-colors md:w-full",
              active ? "bg-surface text-ink" : "text-ink-soft hover:bg-surface/60 hover:text-ink",
            )}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
