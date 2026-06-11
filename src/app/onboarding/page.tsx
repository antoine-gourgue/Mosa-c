import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { InterestsForm } from "@/components/interests";
import { ToastProvider } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getInterestTags, getPopularTags, hasOnboarded } from "@/server/services";

/**
 * Metadata for the onboarding route.
 *
 * @returns The page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("interests");
  return { title: t("onboardingTitle"), robots: { index: false } };
}

/**
 * One-time interest onboarding shown right after signup: pick a few popular tags
 * (or skip) to seed the "For you" feed. Redirects home for anyone who has
 * already been through it, so it never blocks returning users.
 *
 * @returns The onboarding page.
 */
export default async function OnboardingPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  if (await hasOnboarded(user.id)) {
    redirect("/");
  }
  const [popularTags, selectedTags, t] = await Promise.all([
    getPopularTags(50),
    getInterestTags(user.id),
    getTranslations("interests"),
  ]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-ink">{t("onboardingTitle")}</h1>
        <p className="text-ink-soft">{t("onboardingSubtitle")}</p>
      </header>
      <ToastProvider>
        <InterestsForm popularTags={popularTags} selectedTags={selectedTags} mode="onboarding" />
      </ToastProvider>
    </main>
  );
}
