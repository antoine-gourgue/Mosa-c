"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { setLocale } from "@/i18n/actions";
import { locales, type Locale } from "@/i18n/config";

/**
 * The language name shown for each locale, written in its own language
 * (endonym) as is conventional for language pickers.
 */
const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

/**
 * Discreet language picker, mirroring how Instagram surfaces language as a small
 * inline control rather than a settings toggle. Persists the choice in a cookie
 * and refreshes so the new language applies immediately.
 *
 * @returns The language select element.
 */
export function LanguageSwitcher(): ReactElement {
  const current = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const next = event.target.value as Locale;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  return (
    <select
      aria-label={t("language")}
      value={current}
      onChange={onChange}
      disabled={pending}
      className="cursor-pointer rounded-md bg-transparent text-sm text-ink-soft transition-colors hover:text-ink focus:outline-none disabled:opacity-50"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {LOCALE_LABELS[locale]}
        </option>
      ))}
    </select>
  );
}
