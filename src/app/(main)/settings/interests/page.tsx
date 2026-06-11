import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { InterestsForm } from "@/components/interests";
import { SettingsSection } from "@/components/settings";
import { getCurrentUser } from "@/lib/auth";
import { getInterestTagIds, getPopularTags } from "@/server/services";

/**
 * Metadata for the interests-settings route.
 *
 * @returns The page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("settings"), robots: { index: false } };
}

/**
 * Interests tab: edit the tags that personalise the "For you" feed.
 *
 * @returns The interests settings page.
 */
export default async function InterestsSettingsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const [tags, selected, t] = await Promise.all([
    getPopularTags(40),
    getInterestTagIds(user.id),
    getTranslations("settings"),
  ]);
  return (
    <SettingsSection title={t("interestsTitle")} description={t("interestsSubtitle")}>
      <InterestsForm tags={tags} initialSelected={selected} mode="settings" />
    </SettingsSection>
  );
}
