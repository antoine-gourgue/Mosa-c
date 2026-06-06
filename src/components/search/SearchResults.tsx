import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getSavedPinIds, searchPins } from "@/server/services";
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
  const user = await getCurrentUser();
  const [results, savedIds] = await Promise.all([
    searchPins(query, sort),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
  ]);

  return (
    <>
      <div className="mb-2 flex items-center justify-end">
        <FeedFilter active={sort} />
      </div>
      {results.length === 0 ? (
        <div className="mt-16 text-center text-ink-soft">
          No ideas matched &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <PinFeed pins={results} savedIds={savedIds} viewerId={user?.id ?? null} />
      )}
    </>
  );
}
