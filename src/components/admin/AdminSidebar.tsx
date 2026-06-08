"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { Logo } from "@/icons";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/reports", label: "Reports" },
];

/**
 * Determines whether a navigation item matches the current route. The dashboard
 * matches its exact path; the other sections match any nested route.
 *
 * @param href - The navigation item's path.
 * @param pathname - The current pathname.
 * @returns True when the item is active.
 */
function isActive(href: string, pathname: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/**
 * Sidebar navigation for the admin back office: the brand, the section links
 * with an active highlight and a link back to the consumer app. Hidden on small
 * screens since the back office is desktop-oriented.
 *
 * @returns The admin sidebar element.
 */
export function AdminSidebar(): ReactElement {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-bg md:flex">
      <Link href="/admin" className="flex items-center gap-2 px-5 py-5">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-bg">
          <Logo size={20} />
        </span>
        <span className="text-[18px] font-bold text-ink">
          Mosaic <span className="font-semibold text-ink-soft">Admin</span>
        </span>
      </Link>
      <nav className="flex-1 px-3">
        {NAV.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "mb-1 block rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-ink-soft hover:bg-surface hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <Link
          href="/"
          className="block rounded-xl px-3 py-2.5 text-[15px] font-semibold text-ink-soft transition-colors hover:bg-surface hover:text-ink"
        >
          ← Back to app
        </Link>
      </div>
    </aside>
  );
}
