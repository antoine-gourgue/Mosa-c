"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { toggleFollow } from "@/server/actions/follows";
import type { Creator } from "@/types/domain";

/**
 * Props for the {@link CreatorRow} component.
 */
export type CreatorRowProps = {
  creator: Creator;
  initialFollowing: boolean;
};

/**
 * Creator row of the pin detail: avatar, name, follower count and a persistent
 * Follow/Following toggle with optimistic feedback.
 *
 * @param props - The creator and the initial following state.
 * @returns The creator row element.
 */
export function CreatorRow({ creator, initialFollowing }: CreatorRowProps): ReactElement {
  const [following, setFollowing] = useState(initialFollowing);
  const [, startTransition] = useTransition();

  const onToggle = (): void => {
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
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar
        src={creator.avatarUrl ?? undefined}
        name={creator.name}
        size={48}
        verified={creator.verified}
      />
      <div className="flex flex-col">
        <span className="font-semibold text-ink">{creator.name}</span>
        {creator.followersLabel !== null ? (
          <span className="text-sm text-ink-soft">{creator.followersLabel} followers</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "ml-auto h-11 cursor-pointer rounded-full px-5 text-[15px] font-semibold transition-colors duration-150",
          following ? "bg-ink text-bg hover:bg-ink/90" : "bg-surface text-ink hover:bg-surface-2",
        )}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
