import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactElement } from "react";
import { PinDetail } from "@/components/detail";
import { PinFeed } from "@/components/pin";
import { BackIcon } from "@/icons";
import { getCurrentUser } from "@/lib/auth";
import { getLikedPinIds, getPinById, getRelatedPins, getSavedPinIds } from "@/server/services";

/**
 * Builds per-pin metadata so shared links preview the pin's image, title and
 * description.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the pin id.
 * @returns The pin metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pin = await getPinById(id);
  if (pin === null) {
    return { title: (await getTranslations("meta"))("pinNotFound") };
  }
  const description = pin.description ?? `A pin by ${pin.creator.name} on Mosaic.`;
  const image = { url: pin.imageUrl, width: pin.width, height: pin.height, alt: pin.title };
  return {
    title: pin.title,
    description,
    alternates: { canonical: `/pin/${id}` },
    openGraph: { type: "article", title: pin.title, description, images: [image] },
    twitter: { card: "summary_large_image", title: pin.title, description, images: [pin.imageUrl] },
  };
}

/**
 * Standalone pin detail page used for deep links and refreshes.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the pin id.
 * @returns The pin detail page.
 */
export default async function PinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const t = await getTranslations("feed");
  const tg = await getTranslations("page");
  const user = await getCurrentUser();
  const [related, savedIds, likedIds] = await Promise.all([
    getRelatedPins(id, 16, user?.id ?? null),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
    user === null ? Promise.resolve<string[]>([]) : getLikedPinIds(user.id),
  ]);

  return (
    <>
      <div className="mx-auto max-w-[1016px]">
        <Link
          href="/"
          aria-label={t("backToFeed")}
          className="mb-2 -ml-1 inline-flex size-10 items-center justify-center rounded-xl text-ink-soft transition-colors hover:bg-surface hover:text-ink"
        >
          <BackIcon size={20} />
        </Link>
        <PinDetail pinId={id} />
      </div>

      {related.length > 0 ? (
        <section className="mx-auto mt-12 max-w-[1280px]">
          <h2 className="mb-6 text-center text-xl font-bold text-ink">{tg("moreLikeThis")}</h2>
          <PinFeed
            pins={related}
            savedIds={savedIds}
            likedIds={likedIds}
            viewerId={user?.id ?? null}
          />
        </section>
      ) : null}
    </>
  );
}
