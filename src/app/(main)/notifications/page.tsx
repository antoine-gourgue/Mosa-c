import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { NotificationsInbox, SuggestedCreators } from "@/components/notifications";
import { getCurrentUser } from "@/lib/auth";
import { getFollowedCreatorIds, getNotifications, getSuggestedCreators } from "@/server/services";

/**
 * Metadata for the notifications route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("notifications"),
    robots: { index: false },
  };
}

/**
 * Notifications inbox route: the current user's notifications on the left and a
 * sidebar of creators to discover on the right.
 *
 * @returns The notifications page.
 */
export default async function NotificationsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const [items, suggested, followedIds] = await Promise.all([
    getNotifications(user.id),
    getSuggestedCreators(user.id, 5),
    getFollowedCreatorIds(user.id),
  ]);
  const followed = new Set(followedIds);
  const creators = suggested.map((creator) => ({
    creator,
    following: followed.has(creator.id),
  }));

  return (
    <div className="mx-auto flex max-w-5xl gap-8">
      <div className="min-w-0 flex-1">
        <NotificationsInbox items={items} />
      </div>
      <aside className="hidden w-80 shrink-0 lg:block">
        <SuggestedCreators creators={creators} />
      </aside>
    </div>
  );
}
