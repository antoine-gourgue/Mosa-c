import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { PinFeed } from "@/components/pin";
import { ProfileHeader, ProfileTabs } from "@/components/profile";
import type { ProfileTab } from "@/components/profile";
import { getCurrentUser } from "@/lib/auth";
import {
  getCreatedPins,
  getFollowCounts,
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
  return value === "saved" || value === "boards" ? value : "created";
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
  return { title: `@${username}` };
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
}: {
  userId: string;
  savedIds: string[];
}): Promise<ReactElement> {
  const pins = await getCreatedPins(userId);
  if (pins.length === 0) {
    return <p className="py-16 text-center text-ink-soft">No published pins yet.</p>;
  }
  return <PinFeed pins={pins} savedIds={savedIds} />;
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
}: {
  userId: string;
  savedIds: string[];
}): Promise<ReactElement> {
  const pins = await getSavedPins(userId);
  if (pins.length === 0) {
    return <p className="py-16 text-center text-ink-soft">No saved ideas yet.</p>;
  }
  return <PinFeed pins={pins} savedIds={savedIds} />;
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
  username,
}: {
  userId: string;
  username: string | null;
}): Promise<ReactElement> {
  const boards = await getUserBoardsWithCovers(userId, username);
  if (boards.length === 0) {
    return <p className="py-16 text-center text-ink-soft">No boards yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {boards.map((board) => (
        <Link key={board.id} href={`/boards/${board.id}`} className="group block">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
            {board.coverUrl !== null ? (
              <Image
                src={board.coverUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            ) : null}
          </div>
          <p className="mt-2 font-semibold text-ink">{board.name}</p>
          <p className="text-sm text-ink-soft">
            {board.pinCount} {board.pinCount === 1 ? "Pin" : "Pins"}
          </p>
        </Link>
      ))}
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
  const [counts, following, savedIds] = await Promise.all([
    getFollowCounts(user.id),
    viewer !== null && !isOwnProfile ? isFollowing(viewer.id, user.id) : Promise.resolve(false),
    viewer !== null ? getSavedPinIds(viewer.id) : Promise.resolve<string[]>([]),
  ]);
  const active = resolveTab(tab);

  return (
    <div className="mx-auto max-w-[1180px]">
      <ProfileHeader
        user={user}
        followers={counts.followers}
        following={counts.following}
        initialFollowing={following}
        isOwnProfile={isOwnProfile}
      />
      <ProfileTabs username={username} active={active} />
      <div className="mt-6">
        {active === "created" ? <CreatedView userId={user.id} savedIds={savedIds} /> : null}
        {active === "saved" ? <SavedView userId={user.id} savedIds={savedIds} /> : null}
        {active === "boards" ? <BoardsView userId={user.id} username={user.username} /> : null}
      </div>
    </div>
  );
}
