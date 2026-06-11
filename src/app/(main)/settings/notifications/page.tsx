import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { NotificationPrefsForm, PushOptIn, SettingsSection } from "@/components/settings";
import { getCurrentUser } from "@/lib/auth";
import { getNotificationPrefs } from "@/server/services";

/**
 * Metadata for the notification-settings route.
 *
 * @returns The page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("settings"), robots: { index: false } };
}

/**
 * Notification-preferences tab: per-kind in-app delivery toggles for the current
 * user.
 *
 * @returns The notifications settings page.
 */
export default async function NotificationsSettingsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const [prefs, t] = await Promise.all([
    getNotificationPrefs(user.id),
    getTranslations("settings"),
  ]);
  return (
    <SettingsSection title={t("notificationsTitle")} description={t("notificationsSubtitle")}>
      <h2 className="text-lg font-bold text-ink">{t("pushTitle")}</h2>
      <div className="mt-4">
        <PushOptIn />
      </div>
      <h2 className="mt-8 text-lg font-bold text-ink">{t("inAppTitle")}</h2>
      <div className="mt-4">
        <NotificationPrefsForm initialPrefs={prefs} />
      </div>
    </SettingsSection>
  );
}
