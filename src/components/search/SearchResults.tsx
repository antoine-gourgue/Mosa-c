import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getLikedPinIds, getSavedPinIds, searchPins } from "@/server/services";
import type { FeedSort } from "@/server/services";
import { FeedFilter } from "@/components/feed";
import { PinFeed } from "@/components/pin";

/**
 * Props for the {@link SearchResults} component.
 */
export type SearchResultsProps = {
  query: string;
  sort: FeedSort;
};

/**
 * Results view shown when the search has a query: a sort filter, then the
 * matching pins in a masonry, or a friendly empty state quoting the query.
 *
 * @param props - The active search query and sort order.
 * @returns The results view element.
 */
export async function SearchResults({ query, sort }: SearchResultsProps): Promise<ReactElement> {
  const t = await getTranslations("search");
  const user = await getCurrentUser();
  const [results, savedIds, likedIds] = await Promise.all([
    searchPins(query, sort, user?.id ?? null),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
    user === null ? Promise.resolve<string[]>([]) : getLikedPinIds(user.id),
  ]);

  return (
    <>
      <div className="mb-4 flex items-center justify-end border-b border-line pb-1">
        <FeedFilter active={sort} />
      </div>
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
