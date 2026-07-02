import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BoardsGrid } from "@/components/board";
import { PlacesMapButton } from "@/components/location";
import { PinFeed } from "@/components/pin";
import { ArchiveManager, DraftsManager, ProfileHeader, ProfileTabs } from "@/components/profile";
import { ProfileHighlights } from "@/components/stories";
import type { ProfileTab } from "@/components/profile";
import { JsonLd } from "@/components/seo";
import { LockIcon } from "@/icons";
import type { FollowState } from "@/types/domain";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  getBlockState,
  getCreatedPins,
  getFollowCounts,
  getFollowState,
  getDraftAndScheduledPins,
  getArchivedPins,
  getLikedPinIds,
  getLikedPins,
  getPlacedPinsForUser,
  getSavedPinIds,
  getSavedPins,
  getUserBoardsWithCovers,
  getUserByUsername,
} from "@/server/services";

/**
 * Resolves the active profile tab from the URL query.
 *
 * @param value - The raw `tab` query value.
 * @returns The active tab, defaulting to created.
 */
function resolveTab(value: string | undefined): ProfileTab {
  return value === "saved" ||
    value === "boards" ||
    value === "liked" ||
    value === "drafts" ||
    value === "archived"
    ? value
    : "created";
}

/**
 * Builds the profile page metadata.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params.
 * @returns The page metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (user === null) {
    return { title: `@${username}` };
  }
  const description = user.bio ?? `${user.name} on Mosaic.`;
  const images = user.avatarUrl !== null ? [{ url: user.avatarUrl, alt: user.name }] : undefined;
  return {
    title: user.name,
    description,
    alternates: { canonical: `/u/${username}` },
    openGraph: { type: "profile", title: user.name, description, images },
    twitter: {
      card: "summary",
      title: user.name,
      description,
      images: user.avatarUrl !== null ? [user.avatarUrl] : undefined,
    },
  };
}

/**
 * Renders the created pins for a profile.
 *
 * @param props - The profile user id and the viewer's saved ids.
 * @param props.userId - The profile user id.
 * @param props.savedIds - The viewer's saved pin ids.
 * @returns The created pins view.
 */
async function CreatedView({
  userId,
  savedIds,
  likedIds,
  viewerId,
}: {
  userId: string;
  savedIds: string[];
  likedIds: string[];
  viewerId: string | null;
}): Promise<ReactElement> {
  const pins = await getCreatedPins(userId);
  if (pins.length === 0) {
    const t = await getTranslations("page");
    return <p className="py-16 text-center text-ink-soft">{t("noPublishedPins")}</p>;
  }
  return <PinFeed pins={pins} savedIds={savedIds} likedIds={likedIds} viewerId={viewerId} />;
}

/**
 * Renders the pins a profile has saved.
 *
 * @param props - The profile user id and the viewer's saved ids.
 * @param props.userId - The profile user id.
 * @param props.savedIds - The viewer's saved pin ids.
 * @returns The saved pins view.
 */
async function SavedView({
  userId,
  savedIds,
  likedIds,
  viewerId,
}: {
  userId: string;
  savedIds: string[];
  likedIds: string[];
  viewerId: string | null;
}): Promise<ReactElement> {
  const pins = await getSavedPins(userId);
  if (pins.length === 0) {
    const t = await getTranslations("page");
    return <p className="py-16 text-center text-ink-soft">{t("noSavedIdeas")}</p>;
  }
  return <PinFeed pins={pins} savedIds={savedIds} likedIds={likedIds} viewerId={viewerId} />;
}

/**
 * Renders the pins a profile owner has liked. Only used on the owner's own
 * profile.
 *
 * @param props - The profile user id and the viewer's saved/liked ids.
 * @param props.userId - The profile user id.
 * @param props.savedIds - The viewer's saved pin ids.
 * @param props.likedIds - The viewer's liked pin ids.
 * @param props.viewerId - The viewer's user id.
 * @returns The liked pins view.
 */
async function LikedView({
  userId,
  savedIds,
  likedIds,
  viewerId,
}: {
  userId: string;
  savedIds: string[];
  likedIds: string[];
  viewerId: string | null;
}): Promise<ReactElement> {
  const pins = await getLikedPins(userId);
  if (pins.length === 0) {
    const t = await getTranslations("page");
    return <p className="py-16 text-center text-ink-soft">{t("noLikedPins")}</p>;
  }
  return <PinFeed pins={pins} savedIds={savedIds} likedIds={likedIds} viewerId={viewerId} />;
}

/**
 * Renders a profile user's boards as cover cards.
 *
 * @param props - The profile user id and username.
 * @param props.userId - The profile user id.
 * @param props.username - The profile username, for links.
 * @returns The boards grid.
 */
async function BoardsView({
  userId,
  viewerId,
}: {
  userId: string;
  viewerId: string | null;
}): Promise<ReactElement> {
  const boards = await getUserBoardsWithCovers(userId, viewerId);
  return <BoardsGrid boards={boards} />;
}

/**
 * Renders the owner's drafts and upcoming scheduled pins with manage controls.
 *
 * @param props - The owner's user id.
 * @param props.userId - The owner's user id.
 * @returns The drafts management view.
 */
async function DraftsView({ userId }: { userId: string }): Promise<ReactElement> {
  const pins = await getDraftAndScheduledPins(userId);
  return <DraftsManager pins={pins} />;
}

/**
 * Renders the owner's archived pins with controls to restore or delete them.
 *
 * @param props - The owner's user id.
 * @param props.userId - The owner's user id.
 * @returns The archive management view.
 */
async function ArchivedView({ userId }: { userId: string }): Promise<ReactElement> {
  const pins = await getArchivedPins(userId);
  return <ArchiveManager pins={pins} />;
}

/**
 * Notice shown in place of a profile's content when the viewer has blocked the
 * user. The Unblock control lives in the profile header's actions menu.
 *
 * @param props - The blocked user's username, for the message.
 * @param props.username - The blocked user's handle.
 * @returns The blocked-profile notice.
 */
async function BlockedNotice({ username }: { username: string }): Promise<ReactElement> {
  const t = await getTranslations("profile");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-24 text-center">
      <h2 className="text-xl font-bold text-ink">{t("blockedTitle", { user: `@${username}` })}</h2>
      <p className="text-ink-soft">{t("blockedBody")}</p>
    </div>
  );
}

/**
 * Notice shown in place of a private account's content when the viewer is not an
 * approved follower. The Follow/Requested control in the header lets the viewer
 * ask to follow.
 *
 * @returns The private-account notice.
 */
async function PrivateNotice(): Promise<ReactElement> {
  const t = await getTranslations("profile");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-soft">
        <LockIcon size={24} />
      </span>
      <h2 className="text-xl font-bold text-ink">{t("privateTitle")}</h2>
      <p className="text-ink-soft">{t("privateBody")}</p>
    </div>
  );
}

/**
 * Public profile route at `/u/[username]`: header, tabs and the active tab's
 * content.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params with the username.
 * @param props.searchParams - The resolved URL search params.
 * @returns The profile page.
 */
export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}): Promise<ReactElement> {
  const [{ username }, { tab }] = await Promise.all([params, searchParams]);
  const user = await getUserByUsername(username);
  if (user === null) {
    notFound();
  }

  const viewer = await getCurrentUser();
  const isOwnProfile = viewer?.id === user.id;
  const blockState = await getBlockState(viewer?.id ?? null, user.id);
  if (blockState.blocksViewer) {
    const t = await getTranslations("profile");
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-32 text-center">
        <h1 className="text-2xl font-bold text-ink">{t("unavailableTitle")}</h1>
        <p className="text-ink-soft">{t("unavailableBody")}</p>
      </div>
    );
  }
  const [counts, followState, savedIds, likedIds] = await Promise.all([
    getFollowCounts(user.id),
    viewer !== null && !isOwnProfile
      ? getFollowState(viewer.id, user.id)
      : Promise.resolve<FollowState>("none"),
    viewer !== null ? getSavedPinIds(viewer.id) : Promise.resolve<string[]>([]),
    viewer !== null ? getLikedPinIds(viewer.id) : Promise.resolve<string[]>([]),
  ]);
  const requestedTab = resolveTab(tab);
  const ownerOnlyTab =
    requestedTab === "liked" || requestedTab === "drafts" || requestedTab === "archived";
  const active = ownerOnlyTab && !isOwnProfile ? "created" : requestedTab;
  const canViewContent = isOwnProfile || !user.isPrivate || followState === "following";
  const [placedPins, tProfile] = await Promise.all([
    canViewContent ? getPlacedPinsForUser(user.id) : Promise.resolve([]),
    getTranslations("profile"),
  ]);

  return (
    <div className="mx-auto max-w-[1180px]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: user.name,
          description: user.bio ?? `${user.name} on Mosaic.`,
          image: user.avatarUrl ?? undefined,
          url: `${env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/u/${username}`,
        }}
      />
      <ProfileHeader
        user={user}
        followers={counts.followers}
        following={counts.following}
        initialState={followState}
        isOwnProfile={isOwnProfile}
        isAuthed={viewer !== null}
        blockedByViewer={blockState.blockedByViewer}
      />
      {blockState.blockedByViewer ? (
        <BlockedNotice username={username} />
      ) : !canViewContent ? (
        <PrivateNotice />
      ) : (
        <>
          <ProfileHighlights ownerId={user.id} />
          <div className="flex items-center border-b border-line">
            <div className="min-w-0 flex-1">
              <ProfileTabs username={username} active={active} isOwnProfile={isOwnProfile} />
            </div>
            {placedPins.length > 0 ? (
              <div className="shrink-0 pl-1 pr-1">
                <PlacesMapButton
                  pins={placedPins}
                  label={tProfile("map")}
                  heading={tProfile("placesHeading")}
                  closeLabel={tProfile("closeMap")}
                />
              </div>
            ) : null}
          </div>
          <div className="mt-6">
            {active === "created" ? (
              <CreatedView
                userId={user.id}
                savedIds={savedIds}
                likedIds={likedIds}
                viewerId={viewer?.id ?? null}
              />
            ) : null}
            {active === "saved" ? (
              <SavedView
                userId={user.id}
                savedIds={savedIds}
                likedIds={likedIds}
                viewerId={viewer?.id ?? null}
              />
            ) : null}
            {active === "liked" ? (
              <LikedView
                userId={user.id}
                savedIds={savedIds}
                likedIds={likedIds}
                viewerId={viewer?.id ?? null}
              />
            ) : null}
            {active === "boards" ? (
              <BoardsView userId={user.id} viewerId={viewer?.id ?? null} />
            ) : null}
            {active === "drafts" ? <DraftsView userId={user.id} /> : null}
            {active === "archived" ? <ArchivedView userId={user.id} /> : null}
          </div>
        </>
      )}
    </div>
  );
}
