import type { ReactElement } from "react";
import { SITE } from "@/lib/site";
import { Logo } from "@/icons";

/**
 * Temporary landing placeholder rendered until the home feed is implemented.
 *
 * @returns The Mosaic application shell placeholder.
 */
export default function HomePage(): ReactElement {
  return (
    <main className="grid min-h-dvh place-items-center text-center">
      <div className="flex flex-col items-center gap-4">
        <span className="grid size-14 place-items-center rounded-pin bg-accent text-bg shadow-pop">
          <Logo size={30} />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold text-ink">{SITE.name}</h1>
          <p className="mt-1 text-ink-soft">{SITE.description}</p>
        </div>
      </div>
    </main>
  );
}
