"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";

/**
 * Error boundary for the consumer app: a branded recovery screen with a retry
 * and a link back to the feed, rendered inside the app shell.
 *
 * @param props - Error boundary props.
 * @param props.error - The thrown error.
 * @param props.reset - Re-renders the segment to retry.
 * @returns The error screen.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactElement {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-extrabold text-ink">Something went wrong</h1>
      <p className="max-w-md text-ink-soft">
        An unexpected error occurred. Try again, or head back to the feed.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/"
          className="h-11 rounded-xl bg-surface px-5 text-[15px] font-semibold leading-[44px] text-ink transition-colors hover:bg-surface-2"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
