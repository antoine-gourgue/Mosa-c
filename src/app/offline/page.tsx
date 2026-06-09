import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { Logo } from "@/icons";

/**
 * Metadata for the offline fallback route.
 */
export const metadata: Metadata = {
  title: "You're offline",
};

/**
 * Offline fallback page served by the service worker when a navigation fails
 * with no network. Self-contained so it renders without any data fetch.
 *
 * @returns The offline page.
 */
export default function OfflinePage(): ReactElement {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-bg">
          <Logo size={30} />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold text-ink">You&rsquo;re offline</h1>
        <p className="mt-2 text-ink-soft">
          Mosaic needs a connection to load fresh ideas. Check your network and try again.
        </p>
        <Button href="/" className="mt-6">
          Try again
        </Button>
      </div>
    </main>
  );
}
