"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  formatClockTime,
  formatLastActive,
  formatMessageSeparator,
  formatRelativeTime,
  type TimeTranslator,
} from "@/lib/time";

/**
 * Locale-aware time formatters bound to the active locale and `time` messages.
 */
export type TimeFormat = {
  relative: (iso: string) => string;
  lastActive: (iso: string | null) => string | null;
  separator: (iso: string) => string;
  clock: (iso: string) => string;
};

/**
 * Provides the {@link formatRelativeTime} family bound to the current locale and
 * the `time` message catalogue, so components render dates and relative times in
 * the viewer's language without threading the translator and locale by hand.
 *
 * @returns The bound time formatters.
 */
export function useTimeFormat(): TimeFormat {
  const t = useTranslations("time") as TimeTranslator;
  const locale = useLocale();
  return {
    relative: (iso) => formatRelativeTime(iso, t, locale),
    lastActive: (iso) => formatLastActive(iso, t),
    separator: (iso) => formatMessageSeparator(iso, t, locale),
    clock: (iso) => formatClockTime(iso, locale),
  };
}
