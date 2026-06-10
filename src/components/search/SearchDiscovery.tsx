import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { PinFeed } from "@/components/pin";
import { getCurrentUser } from "@/lib/auth";
import { getLikedPinIds, getPins, getPopularTags, getSavedPinIds } from "@/server/services";
import { TagCloud } from "./TagCloud";

/**
 * Discovery view shown when the search has no query: the "Ideas for you"
 * popular-tags cloud and a "Today's Inspiration" masonry feed like the home page.
 *
 * @returns The discovery view element.
 */
export async function SearchDiscovery(): Promise<ReactElement> {
  const t = await getTranslations("search");
  const user = await getCurrentUser();
  const [tags, pins, savedIds, likedIds] = await Promise.all([
    getPopularTags(),
    getPins(user?.id ?? null),
    user === null ? Promise.resolve<string[]>([]) : getSavedPinIds(user.id),
    user === null ? Promise.resolve<string[]>([]) : getLikedPinIds(user.id),
  ]);
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-extrabold text-ink">{t("ideasForYou")}</h2>
      <TagCloud tags={tags} />
      <h2 className="mt-12 text-2xl font-extrabold text-ink">{t("todaysInspiration")}</h2>
      <div className="mt-5">
        <PinFeed pins={pins} savedIds={savedIds} likedIds={likedIds} viewerId={user?.id ?? null} />
      </div>
    </div>
  );
}
