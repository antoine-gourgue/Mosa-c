import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { Logo } from "@/icons";

/**
 * Metadata for the not-found page.
 *
 * @returns The localized not-found metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errorPage");
  return { title: t("pageNotFound") };
}

/**
 * Global 404 page shown for unmatched routes and `notFound()` calls: the brand
 * mark, a large 404, a short message and a link back to the feed.
 *
 * @returns The not-found page.
 */
export default async function NotFound(): Promise<ReactElement> {
  const t = await getTranslations("errorPage");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-bg">
        <Logo size={30} />
      </span>
      <p className="text-[88px] font-extrabold leading-none text-ink">404</p>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-ink">{t("notFoundTitle")}</h1>
        <p className="max-w-sm text-ink-soft">{t("notFoundBody")}</p>
      </div>
      <Link href="/">
        <Button>{t("backHome")}</Button>
      </Link>
    </main>
  );
}
