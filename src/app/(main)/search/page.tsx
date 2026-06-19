import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import type { ReactElement } from "react";
import { SearchDiscovery, SearchField, SearchResults } from "@/components/search";
import type { SearchTab } from "@/components/search";
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
 * Resolves the active result tab from the URL query.
 *
 * @param value - The raw `type` query value.
 * @returns The search tab, defaulting to "top".
 */
function resolveTab(value: string | undefined): SearchTab {
  return value === "pins" || value === "accounts" || value === "tags" ? value : "top";
}

/**
 * Metadata for the search route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("search"),
  };
}

/**
 * Search route: either the discovery view (no query) or the results view
 * (query), read from the `q` URL parameter. The desktop search input lives in
 * the top navigation; on mobile that input is hidden, so the field is rendered
 * here at the top of the page (autofocused on the empty discovery view) and is
 * reached through the bottom navigation's Search tab.
 *
 * @param props - Route props.
 * @param props.searchParams - The resolved URL search parameters.
 * @returns The search page.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; type?: string }>;
}): Promise<ReactElement> {
  const { q, sort, type } = await searchParams;
  const query = (q ?? "").trim();

  return (
    <>
      <div className="mb-4 sm:hidden">
        <Suspense>
          <SearchField autoFocus={query === ""} />
        </Suspense>
      </div>
      {query === "" ? (
        <SearchDiscovery />
      ) : (
        <SearchResults query={query} type={resolveTab(type)} sort={resolveSort(sort)} />
      )}
    </>
  );
}
