"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { PlusIcon } from "@/icons";

/**
 * Whether the floating action button should be visible on the given route.
 *
 * @param pathname - The current pathname.
 * @returns True on the home feed and board routes.
 */
function isVisible(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/boards");
}

/**
 * Fixed bottom-right floating action button that links to the create page.
 * Shown only on the home feed and board routes.
 *
 * @returns The FAB element, or null when hidden.
 */
export function Fab(): ReactElement | null {
  const pathname = usePathname();
  if (!isVisible(pathname)) {
    return null;
  }
  return (
    <Link
      href="/create"
      aria-label="Create Pin"
      className="fixed bottom-6 right-6 z-40 hidden size-16 place-items-center rounded-full bg-bg text-ink shadow-pop transition duration-150 hover:bg-surface active:scale-95 sm:grid"
    >
      <PlusIcon size={28} />
    </Link>
  );
}
