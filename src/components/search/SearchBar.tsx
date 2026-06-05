"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { CameraIcon, SearchIcon } from "@/icons";

/**
 * Enlarged search field shown on the search page, synced to the `q` URL
 * parameter, with a visual-search camera button.
 *
 * @returns The search bar element.
 */
export function SearchBar(): ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.value;
    setValue(next);
    router.replace(next === "" ? "/search" : `/search?q=${encodeURIComponent(next)}`);
  };

  return (
    <div className="mx-auto mt-2 flex h-14 max-w-[920px] items-center gap-3 rounded-full bg-surface px-5">
      <SearchIcon size={22} className="shrink-0 text-ink-soft" />
      <input
        autoFocus
        value={value}
        onChange={onChange}
        placeholder="Search for an idea of any size"
        aria-label="Search"
        className="h-full flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint"
      />
      <button
        type="button"
        aria-label="Visual search"
        className="shrink-0 cursor-pointer text-ink-soft transition-colors hover:text-ink"
      >
        <CameraIcon size={22} />
      </button>
    </div>
  );
}
