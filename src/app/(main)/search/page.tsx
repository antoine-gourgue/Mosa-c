import { Suspense } from "react";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { SearchBar, SearchDiscovery, SearchResults } from "@/components/search";

/**
 * Metadata for the search route.
 */
export const metadata: Metadata = {
  title: "Search",
};

/**
 * Search route: the enlarged search bar plus either the discovery view (no
 * query) or the results view (query), read from the `q` URL parameter.
 *
 * @param props - Route props.
 * @param props.searchParams - The resolved URL search parameters.
 * @returns The search page.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<ReactElement> {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  return (
    <div className="mx-auto max-w-[1180px]">
      <Suspense>
        <SearchBar />
      </Suspense>
      {query === "" ? <SearchDiscovery /> : <SearchResults query={query} />}
    </div>
  );
}
