import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { ReactElement } from "react";
import { PlacesMap } from "@/components/location";
import { PinFeed } from "@/components/pin";
import { JsonLd } from "@/components/seo";
import { getCurrentUser } from "@/lib/auth";
import { getLikedPinIds, getPinsByPlaceSlug, getSavedPinIds } from "@/server/services";

/**
 * Loads a place's pins once per request, shared by the metadata and the page so
 * the (broad) query runs a single time.
 */
const loadPlace = cache(getPinsByPlaceSlug);

/**
 * Builds per-place metadata for sharing and SEO.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the place slug.
 * @returns The place metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await loadPlace(slug, null);
  if (place === null) {
    return { title: (await getTranslations("meta"))("placeNotFound") };
  }
  return {
    title: place.name,
    description: `Pins at ${place.name} on Mosaic.`,
    alternates: { canonical: `/place/${slug}` },
  };
}

/**
 * Public place page: a centered header (place name and pin count) above a map of
 * the place and the masonry of every visible pin tagged there, matching the tag
 * and board collection pages. Approximate pins appear at their fuzzed spot.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the place slug.
 * @returns The place page.
 */
export default async function PlacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ReactElement> {
  const { slug } = await params;
  const user = await getCurrentUser();
  const place = await loadPlace(slug, user?.id ?? null);
  if (place === null) {
    notFound();
  }
  const tb = await getTranslations("board");
  const [savedIds, likedIds] = await Promise.all([
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
    user === null ? Promise.resolve<string[]>([]) : getLikedPinIds(user.id),
  ]);
  const mapPins = place.pins.flatMap((pin) =>
    pin.place === null
      ? []
      : [
          {
            id: pin.id,
            lat: pin.place.lat,
            lng: pin.place.lng,
            title: pin.title,
            imageUrl: pin.imageUrl,
          },
        ],
  );
  const first = place.pins[0]?.place ?? null;

  return (
    <div className="mx-auto max-w-[1180px]">
      {first !== null ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Place",
            name: place.name,
            geo: { "@type": "GeoCoordinates", latitude: first.lat, longitude: first.lng },
          }}
        />
      ) : null}
      <header className="flex flex-col items-center gap-3 py-8 text-center">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{place.name}</h1>
        <p className="text-sm text-ink-soft">{tb("pinCount", { count: place.pins.length })}</p>
      </header>
      {mapPins.length > 0 ? (
        <div className="mb-8 h-64 w-full overflow-hidden rounded-3xl border border-line">
          <PlacesMap pins={mapPins} />
        </div>
      ) : null}
      <PinFeed
        pins={place.pins}
        savedIds={savedIds}
        likedIds={likedIds}
        viewerId={user?.id ?? null}
      />
    </div>
  );
}
