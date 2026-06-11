import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BlockedUsersList, PrivacySettings, SettingsSection } from "@/components/settings";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBlockedUsers } from "@/server/services";

/**
 * Metadata for the privacy-settings route.
 *
 * @returns The page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("settings"), robots: { index: false } };
}

/**
 * Privacy tab: account visibility (private/public) and the blocked-users list,
 * with a Save/Reset bar governing the visibility change.
 *
 * @returns The privacy settings page.
 */
export default async function PrivacySettingsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const [blocked, account, t] = await Promise.all([
    getBlockedUsers(user.id),
    prisma.user.findUnique({ where: { id: user.id }, select: { isPrivate: true } }),
    getTranslations("settings"),
  ]);
  return (
    <SettingsSection title={t("privacyTitle")} description={t("privacySubtitle")}>
      <PrivacySettings
        initialPrivate={account?.isPrivate ?? false}
        blocked={<BlockedUsersList users={blocked} />}
      />
    </SettingsSection>
  );
}
