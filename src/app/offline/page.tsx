import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { Logo } from "@/icons";

/**
 * Metadata for the offline fallback route.
 *
 * @returns The localized offline metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("offline") };
}

/**
 * Offline fallback page served by the service worker when a navigation fails
 * with no network. Self-contained so it renders without any data fetch.
 *
 * @returns The offline page.
 */
export default async function OfflinePage(): Promise<ReactElement> {
  const t = await getTranslations("errorPage");
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-bg">
          <Logo size={30} />
        </span>
        <h1 className="mt-6 text-2xl font-extrabold text-ink">{t("offlineTitle")}</h1>
        <p className="mt-2 text-ink-soft">{t("offlineBody")}</p>
        <Button href="/" className="mt-6">
          {t("tryAgain")}
        </Button>
      </div>
    </main>
  );
}
