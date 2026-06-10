import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BlockedUsersList, SettingsSection } from "@/components/settings";
import { getCurrentUser } from "@/lib/auth";
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
 * Privacy tab: manage the users the current user has blocked.
 *
 * @returns The privacy settings page.
 */
export default async function PrivacySettingsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const [blocked, t] = await Promise.all([getBlockedUsers(user.id), getTranslations("settings")]);
  return (
    <SettingsSection title={t("privacyTitle")} description={t("privacySubtitle")}>
      <h2 className="text-lg font-bold text-ink">{t("blockedTitle")}</h2>
      <div className="mt-4">
        <BlockedUsersList users={blocked} />
      </div>
    </SettingsSection>
  );
}
