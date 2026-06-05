import type { ReactElement } from "react";
import { getCategories } from "@/server/services";
import { CategoryGrid } from "./CategoryGrid";

/**
 * Discovery view shown when the search has no query: the "Ideas for you"
 * category grid and the "Today's Inspiration" rail. The rail is filled in by
 * its own ticket.
 *
 * @returns The discovery view element.
 */
export async function SearchDiscovery(): Promise<ReactElement> {
  const categories = await getCategories();
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-extrabold text-ink">Ideas for you</h2>
      <CategoryGrid categories={categories} />
      <h2 className="mt-12 text-2xl font-extrabold text-ink">Today&rsquo;s Inspiration</h2>
    </div>
  );
}
