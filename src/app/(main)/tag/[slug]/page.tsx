import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { PinFeed } from "@/components/pin";
import { getCurrentUser } from "@/lib/auth";
import { getLikedPinIds, getPinsByTag, getSavedPinIds, getTagBySlug } from "@/server/services";

/**
 * Builds per-tag metadata for sharing and SEO.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the tag slug.
 * @returns The tag metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (tag === null) {
    return { title: "Tag not found" };
  }
  return {
    title: `#${tag.name}`,
    description: `Pins tagged ${tag.name} on Mosaic.`,
    alternates: { canonical: `/tag/${slug}` },
  };
}

/**
 * Tag page: a centered header (tag title and pin count) above the masonry of
 * every pin carrying the tag, matching the board and profile collection pages.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the tag slug.
 * @returns The tag page.
 */
export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ReactElement> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (tag === null) {
    notFound();
  }
  const user = await getCurrentUser();
  const [pins, savedIds, likedIds] = await Promise.all([
    getPinsByTag(slug),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
    user === null ? Promise.resolve<string[]>([]) : getLikedPinIds(user.id),
  ]);

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex flex-col items-center gap-3 py-8 text-center">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">#{tag.name}</h1>
        <p className="text-sm text-ink-soft">
          {pins.length} {pins.length === 1 ? "Pin" : "Pins"}
        </p>
      </header>
      {pins.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">No pins with this tag yet.</p>
      ) : (
        <PinFeed pins={pins} savedIds={savedIds} likedIds={likedIds} viewerId={user?.id ?? null} />
      )}
    </div>
  );
}
