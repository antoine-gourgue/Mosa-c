import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { Logo } from "@/icons";

/**
 * Metadata for the not-found page.
 */
export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * Global 404 page shown for unmatched routes and `notFound()` calls: the brand
 * mark, a large 404, a short message and a link back to the feed.
 *
 * @returns The not-found page.
 */
export default function NotFound(): ReactElement {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-bg">
        <Logo size={30} />
      </span>
      <p className="text-[88px] font-extrabold leading-none text-ink">404</p>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">This idea wandered off</h1>
        <p className="max-w-sm text-ink-soft">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link href="/">
        <Button>Back to home</Button>
      </Link>
    </main>
  );
}
