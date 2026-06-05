"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import { toggleFollow } from "@/server/actions/follows";
import type { Creator } from "@/types/domain";

/**
 * Props for the {@link MiniCreator} component.
 */
export type MiniCreatorProps = {
  creator: Creator;
  initialFollowing: boolean;
};

/**
 * Compact suggested-creator card: a large avatar, name, follower count and an
 * independent, optimistic Follow/Following toggle.
 *
 * @param props - The creator and the initial following state.
 * @returns The mini creator card element.
 */
export function MiniCreator({ creator, initialFollowing }: MiniCreatorProps): ReactElement {
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
    <div className="flex flex-col items-center text-center">
      <Avatar
        src={creator.avatarUrl ?? undefined}
        name={creator.name}
        size={68}
        verified={creator.verified}
      />
      <span className="mt-2 text-sm font-semibold text-ink">{creator.name}</span>
      {creator.followersLabel !== null ? (
        <span className="text-xs text-ink-soft">{creator.followersLabel} followers</span>
      ) : null}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "mt-3 h-9 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors duration-150",
          following ? "bg-ink text-bg hover:bg-ink/90" : "bg-surface text-ink hover:bg-surface-2",
        )}
      >
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
}
