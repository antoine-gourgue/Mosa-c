import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

/**
 * Settings row for the app language: a label and hint beside the shared language
 * picker, surfacing in settings the control otherwise only in the auth footer.
 *
 * @returns The language setting row.
 */
export async function LanguageSetting(): Promise<ReactElement> {
  const t = await getTranslations("settings");
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[15px] font-medium text-ink">{t("language")}</p>
        <p className="text-sm text-ink-soft">{t("languageHint")}</p>
      </div>
      <LanguageSwitcher />
    </div>
  );
}
