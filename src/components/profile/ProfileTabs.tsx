"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * The available profile tabs.
 */
export type ProfileTab = "created" | "saved" | "liked" | "boards" | "drafts";

const TABS: {
  key: ProfileTab;
  labelKey: "tabCreated" | "tabSaved" | "tabLiked" | "tabBoards" | "tabDrafts";
  ownerOnly?: boolean;
}[] = [
  { key: "created", labelKey: "tabCreated" },
  { key: "saved", labelKey: "tabSaved" },
  { key: "liked", labelKey: "tabLiked", ownerOnly: true },
  { key: "boards", labelKey: "tabBoards" },
  { key: "drafts", labelKey: "tabDrafts", ownerOnly: true },
];

/**
 * Props for the {@link ProfileTabs} component.
 */
export type ProfileTabsProps = {
  username: string;
  active: ProfileTab;
  isOwnProfile: boolean;
};

/**
 * Tab navigation for a profile, linking to the created, saved, liked and boards
 * views. The liked tab is shown only on the owner's own profile.
 *
 * @param props - The profile username, the active tab and whether the viewer
 *   owns the profile.
 * @returns The tab navigation element.
 */
export function ProfileTabs({ username, active, isOwnProfile }: ProfileTabsProps): ReactElement {
  const t = useTranslations("profile");
  const tabs = TABS.filter((tab) => isOwnProfile || tab.ownerOnly !== true);
  return (
    <nav className="flex justify-center gap-2 border-b border-line">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/u/${username}?tab=${tab.key}`}
          aria-current={active === tab.key ? "page" : undefined}
          className={cn(
            "relative px-4 py-3 text-sm font-semibold transition-colors",
            active === tab.key ? "text-ink" : "text-ink-soft hover:text-ink",
          )}
        >
          {t(tab.labelKey)}
          {active === tab.key ? (
            <span className="absolute inset-x-2 -bottom-px h-1 rounded-full bg-ink" />
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
