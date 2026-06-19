"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

const DEBOUNCE_MS = 250;

/**
 * Search input that updates the results live as the user types — no Enter
 * needed — seeded from the current `q` query parameter. Typing is reflected
 * instantly while navigation is debounced and uses `replace` once on the search
 * page (so keystrokes don't spam history), preserving the active result tab and
 * resetting the pin sort. Shared by the desktop top navigation and the mobile
 * search page so a single behaviour drives both surfaces.
 *
 * @param props - Optional autofocus flag and wrapper class overrides.
 * @returns The search field element.
 */
export function SearchField({ autoFocus = false, className }: SearchFieldProps): ReactElement {
  const t = useTranslations("search");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setQuery(value);
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      const params = new URLSearchParams();
      const type = searchParams.get("type");
      if (type !== null && type !== "") {
        params.set("type", type);
      }
      if (value.trim() !== "") {
        params.set("q", value);
      }
      const qs = params.toString();
      const target = qs === "" ? "/search" : `/search?${qs}`;
      if (pathname === "/search") {
        router.replace(target);
      } else {
        router.push(target);
      }
    }, DEBOUNCE_MS);
  };

  return (
    <Input
      value={query}
      onChange={onChange}
      autoFocus={autoFocus}
      placeholder={t("placeholder")}
      aria-label={t("label")}
      leadingIcon={<SearchIcon size={20} />}
      className={className}
    />
  );
}
