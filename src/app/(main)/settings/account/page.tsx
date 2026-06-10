import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { DeleteAccount, LanguageSetting, SettingsSection } from "@/components/settings";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Metadata for the account-settings route.
 *
 * @returns The page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("settings"), robots: { index: false } };
}

/**
 * Account tab: app language and the danger zone (permanent account deletion).
 *
 * @returns The account settings page.
 */
export default async function AccountSettingsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const [record, t] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { username: true } }),
    getTranslations("settings"),
  ]);
  return (
    <SettingsSection title={t("accountTitle")} description={t("accountSubtitle")}>
      <div className="flex flex-col gap-8">
        <LanguageSetting />
        <DeleteAccount username={record?.username ?? null} />
      </div>
    </SettingsSection>
  );
}
