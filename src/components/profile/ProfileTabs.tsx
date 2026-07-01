"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Tabs } from "@/components/ui";

/**
 * The available profile tabs.
 */
export type ProfileTab = "created" | "saved" | "liked" | "boards" | "drafts" | "archived";

const TABS: {
  key: ProfileTab;
  labelKey: "tabCreated" | "tabSaved" | "tabLiked" | "tabBoards" | "tabDrafts" | "tabArchived";
  ownerOnly?: boolean;
}[] = [
  { key: "created", labelKey: "tabCreated" },
  { key: "saved", labelKey: "tabSaved" },
  { key: "liked", labelKey: "tabLiked", ownerOnly: true },
  { key: "boards", labelKey: "tabBoards" },
  { key: "drafts", labelKey: "tabDrafts", ownerOnly: true },
  { key: "archived", labelKey: "tabArchived", ownerOnly: true },
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
    <Tabs
      ariaLabel={t("tabsAria")}
      active={active}
      items={tabs.map((tab) => ({
        key: tab.key,
        label: t(tab.labelKey),
        href: `/u/${username}?tab=${tab.key}`,
      }))}
    />
  );
}
