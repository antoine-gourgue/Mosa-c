import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SearchDiscovery, SearchResults } from "@/components/search";
import type { FeedSort } from "@/server/services";

/**
 * Resolves the feed sort from the URL query.
 *
 * @param value - The raw `sort` query value.
 * @returns The feed sort, defaulting to "recent".
 */
function resolveSort(value: string | undefined): FeedSort {
  return value === "likes" || value === "downloads" || value === "comments" ? value : "recent";
}

/**
 * Metadata for the search route.
 */
export const metadata: Metadata = {
  title: "Search",
};

/**
 * Search route: either the discovery view (no query) or the results view
 * (query), read from the `q` URL parameter. Search input lives in the top
 * navigation, which is shared across the app.
 *
 * @param props - Route props.
 * @param props.searchParams - The resolved URL search parameters.
 * @returns The search page.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}): Promise<ReactElement> {
  const { q, sort } = await searchParams;
  const query = (q ?? "").trim();

  return query === "" ? (
    <div className="mx-auto max-w-[1180px]">
      <SearchDiscovery />
    </div>
  ) : (
    <SearchResults query={query} sort={resolveSort(sort)} />
  );
}
