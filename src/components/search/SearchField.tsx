"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { Input } from "@/components/ui";
import { SearchIcon } from "@/icons";

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
    <Input
      value={query}
      onChange={onChange}
      autoFocus={autoFocus}
      placeholder="Search for ideas"
      aria-label="Search"
      leadingIcon={<SearchIcon size={20} />}
      className={className}
    />
  );
}
