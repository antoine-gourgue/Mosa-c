import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactElement } from "react";
import { Avatar } from "@/components/ui";
import type { Creator } from "@/types/domain";
import { FollowButton } from "./FollowButton";
import { FollowerCount } from "./FollowerCount";
import { MessageButton } from "./MessageButton";
import { ProfileActions } from "./ProfileActions";

/**
 * Props for the {@link ProfileHeader} component.
 */
export type ProfileHeaderProps = {
  user: Creator;
  followers: number;
  following: number;
  initialFollowing: boolean;
  isOwnProfile: boolean;
  isAuthed: boolean;
  blockedByViewer: boolean;
};

/**
 * Profile header: large avatar, name, handle, bio, follower/following counts and
 * a Follow button (hidden on the viewer's own profile).
 *
 * @param props - The profile user, counts and viewer state.
 * @returns The profile header element.
 */
export async function ProfileHeader({
  user,
  followers,
  following,
  initialFollowing,
  isOwnProfile,
  isAuthed,
  blockedByViewer,
}: ProfileHeaderProps): Promise<ReactElement> {
  const t = await getTranslations("profile");
  return (
    <header className="flex flex-col items-center gap-3 py-10 text-center">
      <Avatar
        src={user.avatarUrl ?? undefined}
        name={user.name}
        size={96}
        verified={user.verified}
      />
      <h1 className="text-4xl font-extrabold text-ink">{user.name}</h1>
      {user.username !== null ? <p className="text-ink-soft">@{user.username}</p> : null}
      {user.bio !== null ? <p className="max-w-md text-ink">{user.bio}</p> : null}
      <p className="text-sm text-ink-soft">
        <FollowerCount
          creatorId={user.id}
          followers={followers}
          initialFollowing={initialFollowing}
        />{" "}
        {t("followersLabel")} · <span className="font-semibold text-ink">{following}</span>{" "}
        {t("followingLabel")}
      </p>
      {isOwnProfile ? (
        <Link
          href="/settings/profile"
          className="h-11 rounded-full bg-surface px-5 text-[15px] font-semibold leading-[44px] text-ink transition-colors hover:bg-surface-2"
        >
          {t("editProfile")}
        </Link>
      ) : (
        <div className="flex items-center gap-2">
          <FollowButton
            creatorId={user.id}
            initialFollowing={initialFollowing}
            isAuthed={isAuthed}
          />
          {isAuthed ? <MessageButton userId={user.id} /> : null}
          {isAuthed ? (
            <ProfileActions
              userId={user.id}
              username={user.username}
              initialBlocked={blockedByViewer}
            />
          ) : null}
        </div>
      )}
    </header>
  );
}
