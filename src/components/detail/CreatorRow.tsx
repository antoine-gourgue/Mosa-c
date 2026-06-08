"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Avatar, Button } from "@/components/ui";
import { useAuthPrompt } from "@/hooks/use-auth-prompt";
import { toggleFollow } from "@/server/actions/follows";
import type { Creator } from "@/types/domain";

/**
 * Props for the {@link CreatorRow} component.
 */
export type CreatorRowProps = {
  creator: Creator;
  initialFollowing: boolean;
  isSelf?: boolean;
  followers: number;
  isAuthed?: boolean;
};

/**
 * Creator row of the pin detail: avatar, name, follower count and a persistent
 * Follow/Following toggle with optimistic feedback. The follow toggle is hidden
 * when the viewer is the creator, since a user cannot follow themselves.
 *
 * @param props - The creator, the initial following state and whether the
 *   viewer is the creator.
 * @returns The creator row element.
 */
export function CreatorRow({
  creator,
  initialFollowing,
  isSelf = false,
  followers,
  isAuthed = true,
}: CreatorRowProps): ReactElement {
  const [following, setFollowing] = useState(initialFollowing);
  const [, startTransition] = useTransition();
  const withAuth = useAuthPrompt(isAuthed);

  const onToggle = (): void => {
    withAuth(() => {
      const wasFollowing = following;
      setFollowing(!wasFollowing);
      startTransition(async () => {
        try {
          const result = await toggleFollow(creator.id);
          setFollowing(result.following);
        } catch {
          setFollowing(wasFollowing);
        }
      });
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Link
        href={creator.username !== null ? `/u/${creator.username}` : "#"}
        className="flex items-center gap-3"
      >
        <Avatar
          src={creator.avatarUrl ?? undefined}
          name={creator.name}
          size={48}
          verified={creator.verified}
        />
        <div className="flex flex-col text-left">
          <span className="font-semibold text-ink hover:underline">{creator.name}</span>
          <span className="text-sm text-ink-soft">
            {followers} {followers === 1 ? "follower" : "followers"}
          </span>
        </div>
      </Link>
      {isSelf ? null : (
        <Button variant={following ? "dark" : "ghost"} className="ml-auto" onClick={onToggle}>
          {following ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}
