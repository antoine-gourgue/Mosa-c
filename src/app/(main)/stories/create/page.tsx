import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { CreateStory } from "@/components/stories";
import { getCurrentUser } from "@/lib/auth";

/**
 * Metadata for the create story route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stories");
  return {
    title: t("createTitle"),
    robots: { index: false },
  };
}

/**
 * Create Story route. Requires an authenticated user.
 *
 * @returns The create story page.
 */
export default async function CreateStoryPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  return <CreateStory />;
}
