import Link from "next/link";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * The available profile tabs.
 */
export type ProfileTab = "created" | "saved" | "liked" | "boards";

const TABS: { key: ProfileTab; label: string; ownerOnly?: boolean }[] = [
  { key: "created", label: "Created" },
  { key: "saved", label: "Saved" },
  { key: "liked", label: "Liked", ownerOnly: true },
  { key: "boards", label: "Boards" },
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
          {tab.label}
          {active === tab.key ? (
            <span className="absolute inset-x-2 -bottom-px h-1 rounded-full bg-ink" />
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
