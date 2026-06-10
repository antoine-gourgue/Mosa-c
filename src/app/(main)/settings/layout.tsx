import { getTranslations } from "next-intl/server";
import type { ReactElement, ReactNode } from "react";
import { SettingsNav } from "@/components/settings";

/**
 * Shared layout for the settings hub: a left navigation sidebar (the section
 * list) beside the active section's content, using the full page width.
 *
 * @param props - Layout props.
 * @param props.children - The active settings tab's content.
 * @returns The settings shell.
 */
export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  const t = await getTranslations("settings");
  return (
    <div className="py-4 md:flex md:gap-12">
      <aside className="md:w-60 md:shrink-0">
        <h1 className="mb-3 px-4 text-2xl font-extrabold text-ink md:px-4">{t("hubTitle")}</h1>
        <SettingsNav />
      </aside>
      <div className="mt-6 min-w-0 flex-1 md:mt-1">{children}</div>
    </div>
  );
}
