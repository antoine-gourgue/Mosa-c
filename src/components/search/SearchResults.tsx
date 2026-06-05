import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getSavedPinIds, searchPins } from "@/server/services";
import { PinFeed } from "@/components/pin";

/**
 * Props for the {@link SearchResults} component.
 */
export type SearchResultsProps = {
  query: string;
};

/**
 * Results view shown when the search has a query: the matching pins in a
 * masonry, or a friendly empty state quoting the query.
 *
 * @param props - The active search query.
 * @returns The results view element.
 */
export async function SearchResults({ query }: SearchResultsProps): Promise<ReactElement> {
  const user = await getCurrentUser();
  const [results, savedIds] = await Promise.all([
    searchPins(query),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
  ]);

  if (results.length === 0) {
    return (
      <div className="mt-16 text-center text-ink-soft">No ideas matched &ldquo;{query}&rdquo;.</div>
    );
  }

  return (
    <div className="mt-6">
      <PinFeed pins={results} savedIds={savedIds} min={200} />
    </div>
  );
}
