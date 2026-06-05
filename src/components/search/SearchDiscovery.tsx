import type { ReactElement } from "react";

/**
 * Discovery view shown when the search has no query: the "Ideas for you"
 * category grid and the "Today's Inspiration" rail. The grid and rail are
 * filled in by their own tickets.
 *
 * @returns The discovery view element.
 */
export function SearchDiscovery(): ReactElement {
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-extrabold text-ink">Ideas for you</h2>
      <h2 className="mt-12 text-2xl font-extrabold text-ink">Today&rsquo;s Inspiration</h2>
    </div>
  );
}
