import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BoardsGrid } from "@/components/board";
import { PinFeed } from "@/components/pin";
import { ProfileHeader, ProfileTabs } from "@/components/profile";
import type { ProfileTab } from "@/components/profile";
import { JsonLd } from "@/components/seo";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  areMutualFollowers,
  getCreatedPins,
  getFollowCounts,
  getLikedPinIds,
  getLikedPins,
  getSavedPinIds,
  getSavedPins,
  getUserBoardsWithCovers,
  getUserByUsername,
  isFollowing,
} from "@/server/services";

/**
 * Resolves the active profile tab from the URL query.
 *
 * @param value - The raw `tab` query value.
 * @returns The active tab, defaulting to created.
 */
function resolveTab(value: string | undefined): ProfileTab {
  return value === "saved" || value === "boards" || value === "liked" ? value : "created";
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
    return <p className="py-16 text-center text-ink-soft">No published pins yet.</p>;
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
    return <p className="py-16 text-center text-ink-soft">No saved ideas yet.</p>;
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
    return <p className="py-16 text-center text-ink-soft">No liked pins yet.</p>;
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
async function BoardsView({ userId }: { userId: string }): Promise<ReactElement> {
  const boards = await getUserBoardsWithCovers(userId);
  return <BoardsGrid boards={boards} />;
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
  const [counts, following, savedIds, likedIds, canMessage] = await Promise.all([
    getFollowCounts(user.id),
    viewer !== null && !isOwnProfile ? isFollowing(viewer.id, user.id) : Promise.resolve(false),
    viewer !== null ? getSavedPinIds(viewer.id) : Promise.resolve<string[]>([]),
    viewer !== null ? getLikedPinIds(viewer.id) : Promise.resolve<string[]>([]),
    viewer !== null && !isOwnProfile
      ? areMutualFollowers(viewer.id, user.id)
      : Promise.resolve(false),
  ]);
  const requestedTab = resolveTab(tab);
  const active = requestedTab === "liked" && !isOwnProfile ? "created" : requestedTab;

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
        initialFollowing={following}
        isOwnProfile={isOwnProfile}
        isAuthed={viewer !== null}
        canMessage={canMessage}
      />
      <ProfileTabs username={username} active={active} isOwnProfile={isOwnProfile} />
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
        {active === "boards" ? <BoardsView userId={user.id} /> : null}
      </div>
    </div>
  );
}
