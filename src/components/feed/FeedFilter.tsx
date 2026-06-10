"use client";

import { useTranslations } from "next-intl";
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

const OPTIONS: {
  value: FeedSort;
  labelKey: "mostRecent" | "mostLiked" | "mostDownloaded" | "mostCommented";
}[] = [
  { value: "recent", labelKey: "mostRecent" },
  { value: "likes", labelKey: "mostLiked" },
  { value: "downloads", labelKey: "mostDownloaded" },
  { value: "comments", labelKey: "mostCommented" },
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
  const t = useTranslations("feed");
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
      label={t("sortPins")}
      icon={<SlidersIcon size={20} />}
      align="end"
      items={OPTIONS.map((option) => ({
        label: t(option.labelKey),
        icon: option.value === active ? <CheckIcon size={18} /> : undefined,
        onSelect: () => router.push(hrefFor(option.value)),
      }))}
    />
  );
}
