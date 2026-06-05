import type { ReactElement } from "react";
import { getCategories, getPins } from "@/server/services";
import { CategoryGrid } from "./CategoryGrid";
import { InspirationRail } from "./InspirationRail";

/**
 * Discovery view shown when the search has no query: the "Ideas for you"
 * category grid and the "Today's Inspiration" rail.
 *
 * @returns The discovery view element.
 */
export async function SearchDiscovery(): Promise<ReactElement> {
  const [categories, pins] = await Promise.all([getCategories(), getPins()]);
  const inspiration = pins.slice(0, 8);
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-extrabold text-ink">Ideas for you</h2>
      <CategoryGrid categories={categories} />
      <h2 className="mt-12 text-2xl font-extrabold text-ink">Today&rsquo;s Inspiration</h2>
      <InspirationRail pins={inspiration} />
    </div>
  );
}
