import Link from "next/link";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";
import type { FeedSort, FeedSource } from "@/server/services";

/**
 * Props for the {@link FeedTabs} component.
 */
export type FeedTabsProps = {
  active: FeedSource;
  sort: FeedSort;
};

const TABS: { value: FeedSource; label: string }[] = [
  { value: "foryou", label: "For you" },
  { value: "following", label: "Following" },
];

/**
 * Builds the home URL for a feed source while preserving the active sort.
 *
 * @param feed - The target feed source.
 * @param sort - The active sort to preserve.
 * @returns The home href.
 */
function hrefFor(feed: FeedSource, sort: FeedSort): string {
  const params = new URLSearchParams();
  if (feed === "following") {
    params.set("feed", "following");
  }
  if (sort !== "recent") {
    params.set("sort", sort);
  }
  const query = params.toString();
  return query === "" ? "/" : `/?${query}`;
}

/**
 * Home feed source tabs styled as underlined text tabs (matching the profile
 * tabs): For you (all pins) and Following (pins from followed creators).
 * Deep-linked via `?feed`, preserving the active sort, with the active tab
 * underlined.
 *
 * @param props - The active feed source and sort.
 * @returns The feed tabs element.
 */
export function FeedTabs({ active, sort }: FeedTabsProps): ReactElement {
  return (
    <nav className="flex gap-5">
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <Link
            key={tab.value}
            href={hrefFor(tab.value, sort)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative px-1 py-3 text-[15px] font-semibold transition-colors",
              isActive ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {tab.label}
            {isActive ? (
              <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-ink" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
