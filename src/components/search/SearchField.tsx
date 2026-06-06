"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { SearchIcon } from "@/icons";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link SearchField} component.
 */
export type SearchFieldProps = {
  autoFocus?: boolean;
  className?: string;
};

/**
 * Search input that routes to the search page as the user types, seeded from
 * the current `q` query parameter. Shared by the desktop top navigation and the
 * mobile search page so a single behaviour drives both surfaces.
 *
 * @param props - Optional autofocus flag and wrapper class overrides.
 * @returns The search field element.
 */
export function SearchField({ autoFocus = false, className }: SearchFieldProps): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setQuery(value);
    router.push(value === "" ? "/search" : `/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">
        <SearchIcon size={20} />
      </span>
      <input
        value={query}
        onChange={onChange}
        autoFocus={autoFocus}
        placeholder="Search for ideas"
        aria-label="Search"
        className="h-12 w-full rounded-3xl bg-surface pl-11 pr-4 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:bg-surface-2"
      />
    </div>
  );
}
