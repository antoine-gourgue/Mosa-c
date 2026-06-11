import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AnalyticsDashboard } from "@/components/analytics";
import { SettingsSection } from "@/components/settings";
import { getCurrentUser } from "@/lib/auth";
import { getCreatorAnalytics } from "@/server/services";

/**
 * Metadata for the analytics-settings route.
 *
 * @returns The page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("settings"), robots: { index: false } };
}

/**
 * Analytics tab: the creator's engagement stats across their pins.
 *
 * @returns The analytics settings page.
 */
export default async function AnalyticsSettingsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const [analytics, t] = await Promise.all([
    getCreatorAnalytics(user.id),
    getTranslations("settings"),
  ]);
  return (
    <SettingsSection title={t("analyticsTitle")} description={t("analyticsSubtitle")}>
      <AnalyticsDashboard analytics={analytics} />
    </SettingsSection>
  );
}
