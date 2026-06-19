import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getLikedPinIds, getSavedPinIds, searchPins } from "@/server/services";
import type { FeedSort } from "@/server/services";
import { FeedFilter } from "@/components/feed";
import { PinFeed } from "@/components/pin";
import { SearchTabs } from "./SearchTabs";
import type { SearchTab } from "./SearchTabs";

/**
 * Props for the {@link SearchResults} component.
 */
export type SearchResultsProps = {
  query: string;
  type: SearchTab;
  sort: FeedSort;
};

/**
 * The matching pins for a query as a masonry, or a friendly empty state. Shared
 * by the "Top" and "Pins" tabs; only the latter shows the sort control.
 *
 * @param props - The query, the sort, and whether to show the sort control.
 * @returns The pin results element.
 */
async function PinResults({
  query,
  sort,
  withSort,
}: {
  query: string;
  sort: FeedSort;
  withSort: boolean;
}): Promise<ReactElement> {
  const t = await getTranslations("search");
  const user = await getCurrentUser();
  const [results, savedIds, likedIds] = await Promise.all([
    searchPins(query, sort, user?.id ?? null),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
    user === null ? Promise.resolve<string[]>([]) : getLikedPinIds(user.id),
  ]);

  return (
    <>
      {withSort ? (
        <div className="mb-4 flex items-center justify-end border-b border-line pb-1">
          <FeedFilter active={sort} />
        </div>
      ) : null}
      {results.length === 0 ? (
        <div className="mt-16 text-center text-ink-soft">{t("noResults", { query })}</div>
      ) : (
        <PinFeed
          key={sort}
          pins={results}
          savedIds={savedIds}
          likedIds={likedIds}
          viewerId={user?.id ?? null}
        />
      )}
    </>
  );
}

/**
 * Results view shown when the search has a query: the result tabs, then the
 * content for the active tab. The "Top" and "Pins" tabs render the matching
 * pins (Pins adds a sort control); the "Accounts" and "Tags" tabs are filled in
 * by their own tickets.
 *
 * @param props - The active query, tab and sort order.
 * @returns The results view element.
 */
export async function SearchResults({
  query,
  type,
  sort,
}: SearchResultsProps): Promise<ReactElement> {
  const t = await getTranslations("search");

  return (
    <>
      <SearchTabs active={type} />
      {type === "accounts" || type === "tags" ? (
        <div className="mt-16 text-center text-ink-soft">{t("tabComingSoon")}</div>
      ) : (
        <PinResults query={query} sort={sort} withSort={type === "pins"} />
      )}
    </>
  );
}
