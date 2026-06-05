"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { Avatar, IconButton, Pill } from "@/components/ui";
import { BellIcon, Logo, PlusIcon, SearchIcon, StackIcon } from "@/icons";

/**
 * Props for the {@link TopNav} component.
 */
export type TopNavProps = {
  user: { name: string; image: string | null };
};

/**
 * Sticky top navigation: brand, Home/Saved tabs, a central search field that
 * routes to the search page as the user types, and the action icons (create,
 * notifications, saves, profile).
 *
 * @param props - The current user used for the profile avatar.
 * @returns The top navigation element.
 */
export function TopNav({ user }: TopNavProps): ReactElement {
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
    <nav className="sticky top-0 z-50 flex h-20 items-center gap-3 bg-bg/90 px-6 backdrop-blur-md backdrop-saturate-150">
      <Link href="/" className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-bg">
          <Logo size={20} />
        </span>
        <span className="text-[21px] font-bold text-accent">Mosaic</span>
      </Link>

      <Pill href="/" active={pathname === "/"}>
        Home
      </Pill>
      <Pill href="/boards" active={pathname.startsWith("/boards")}>
        Saved
      </Pill>

      <div className="relative flex-1">
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
          placeholder="Search for an idea of any size"
          aria-label="Search"
          className="h-12 w-full rounded-3xl bg-surface pl-11 pr-4 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:bg-surface-2"
        />
      </div>

      <div className="flex items-center gap-1">
        <IconButton label="Create" onClick={() => router.push("/create")}>
          <PlusIcon />
        </IconButton>
        <IconButton label="Notifications" className="relative">
          <BellIcon size={22} />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" />
        </IconButton>
        <IconButton
          label="Saves"
          active={pathname.startsWith("/boards")}
          onClick={() => router.push("/boards")}
        >
          <StackIcon size={22} />
        </IconButton>
        <Link href="/boards" aria-label="Profile" className="ml-1">
          <Avatar name={user.name} src={user.image ?? undefined} size={44} />
        </Link>
      </div>
    </nav>
  );
}
