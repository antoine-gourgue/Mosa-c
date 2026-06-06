"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { Avatar, IconButton } from "@/components/ui";
import { BellIcon, Logo, PlusIcon, SearchIcon, StackIcon } from "@/icons";

/**
 * Props for the {@link TopNav} component.
 */
export type TopNavProps = {
  user: { name: string; image: string | null; username: string | null };
  unreadCount: number;
};

/**
 * Sticky top navigation: brand, Home/Saved tabs, a central search field that
 * routes to the search page as the user types, and the action icons (create,
 * notifications, saves, profile).
 *
 * @param props - The current user used for the profile avatar.
 * @returns The top navigation element.
 */
export function TopNav({ user, unreadCount }: TopNavProps): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setQuery(value);
    router.push(value === "" ? "/search" : `/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <nav className="sticky top-0 z-50 flex h-20 items-center gap-2 bg-bg/90 px-4 backdrop-blur-md backdrop-saturate-150 sm:gap-3 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-bg">
          <Logo size={20} />
        </span>
        <span className="hidden text-[21px] font-bold text-accent sm:inline">Mosaic</span>
      </Link>

      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-2xl">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">
            <SearchIcon size={20} />
          </span>
          <input
            value={query}
            onChange={onSearchChange}
            onFocus={() => {
              if (!pathname.startsWith("/search")) {
                router.push("/search");
              }
            }}
            placeholder="Search for ideas"
            aria-label="Search"
            className="h-12 w-full rounded-3xl bg-surface pl-11 pr-4 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:bg-surface-2"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <IconButton label="Create" onClick={() => router.push("/create")}>
          <PlusIcon />
        </IconButton>
        <div className="hidden items-center gap-1 sm:flex">
          <IconButton
            label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
            active={pathname.startsWith("/notifications")}
            onClick={() => router.push("/notifications")}
            className="relative"
          >
            <BellIcon size={22} />
            {unreadCount > 0 ? (
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" />
            ) : null}
          </IconButton>
          <IconButton
            label="Saves"
            active={pathname.startsWith("/boards")}
            onClick={() => router.push("/boards")}
          >
            <StackIcon size={22} />
          </IconButton>
        </div>
        <Link
          href={user.username !== null ? `/u/${user.username}` : "/boards"}
          aria-label="Profile"
          className="ml-1 shrink-0"
        >
          <Avatar name={user.name} src={user.image ?? undefined} size={44} />
        </Link>
      </div>
    </nav>
  );
}
