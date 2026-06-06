"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { Menu } from "@/components/ui";
import { CheckIcon, SlidersIcon } from "@/icons";
import type { FeedSort } from "@/server/services";

/**
 * Props for the {@link FeedFilter} component.
 */
export type FeedFilterProps = {
  active: FeedSort;
};

const OPTIONS: { value: FeedSort; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "likes", label: "Most liked" },
  { value: "downloads", label: "Most downloaded" },
  { value: "comments", label: "Most commented" },
];

/**
 * Sort control for the home and search feeds: an icon button that opens a panel
 * of sort options (recent, most liked, downloaded or commented). The active
 * option is checked, and selecting one updates the `sort` URL parameter while
 * preserving every other parameter (search query, feed source).
 *
 * @param props - The active sort.
 * @returns The feed sort control.
 */
export function FeedFilter({ active }: FeedFilterProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (sort: FeedSort): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "recent") {
      params.delete("sort");
    } else {
      params.set("sort", sort);
    }
    const query = params.toString();
    return query === "" ? pathname : `${pathname}?${query}`;
  };

  return (
    <Menu
      label="Sort pins"
      icon={<SlidersIcon size={20} />}
      align="end"
      items={OPTIONS.map((option) => ({
        label: option.label,
        icon: option.value === active ? <CheckIcon size={18} /> : undefined,
        onSelect: () => router.push(hrefFor(option.value)),
      }))}
    />
  );
}
