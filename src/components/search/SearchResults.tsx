import type { ReactElement } from "react";

/**
 * Props for the {@link SearchResults} component.
 */
export type SearchResultsProps = {
  query: string;
};

/**
 * Results view shown when the search has a query. The filtered pins and empty
 * state are wired in by a later ticket.
 *
 * @param props - The active search query.
 * @returns The results view element.
 */
export function SearchResults({ query }: SearchResultsProps): ReactElement {
  return <p className="mt-8 text-ink-soft">Showing results for &ldquo;{query}&rdquo;</p>;
}
