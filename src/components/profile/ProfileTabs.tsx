import Link from "next/link";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * The available profile tabs.
 */
export type ProfileTab = "created" | "saved" | "boards";

const TABS: { key: ProfileTab; label: string }[] = [
  { key: "created", label: "Created" },
  { key: "saved", label: "Saved" },
  { key: "boards", label: "Boards" },
];

/**
 * Props for the {@link ProfileTabs} component.
 */
export type ProfileTabsProps = {
  username: string;
  active: ProfileTab;
};

/**
 * Tab navigation for a profile, linking to the created, saved and boards views.
 *
 * @param props - The profile username and the active tab.
 * @returns The tab navigation element.
 */
export function ProfileTabs({ username, active }: ProfileTabsProps): ReactElement {
  return (
    <nav className="flex justify-center gap-2 border-b border-line">
      {TABS.map((tab) => (
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
