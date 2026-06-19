"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * The search result tabs, mirrored in the `type` URL parameter.
 */
export type SearchTab = "top" | "pins" | "accounts" | "tags";

const TABS: { value: SearchTab; key: "tabTop" | "tabPins" | "tabAccounts" | "tabTags" }[] = [
  { value: "top", key: "tabTop" },
  { value: "pins", key: "tabPins" },
  { value: "accounts", key: "tabAccounts" },
  { value: "tags", key: "tabTags" },
];

/**
 * Props for the {@link SearchTabs} component.
 */
export type SearchTabsProps = {
  active: SearchTab;
};

/**
 * Instagram-style tab bar for the search results: Top, Pins, Accounts and Tags.
 * Each tab is a link that sets the `type` URL parameter while preserving the
 * query, so results are deep-linkable; switching tabs resets the pin sort. The
 * active tab is marked with `aria-current` and an underline.
 *
 * @param props - The active tab.
 * @returns The search tab bar.
 */
export function SearchTabs({ active }: SearchTabsProps): ReactElement {
  const t = useTranslations("search");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (tab: SearchTab): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "top") {
      params.delete("type");
    } else {
      params.set("type", tab);
    }
    params.delete("sort");
    const query = params.toString();
    return query === "" ? pathname : `${pathname}?${query}`;
  };

  return (
    <nav
      aria-label={t("resultTabs")}
      className="mb-4 flex gap-1 border-b border-line text-sm font-semibold"
    >
      {TABS.map((tab) => {
        const isActive = tab.value === active;
        return (
          <Link
            key={tab.value}
            href={hrefFor(tab.value)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative px-3 py-2.5 transition-colors",
              isActive ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {t(tab.key)}
            {isActive ? (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
