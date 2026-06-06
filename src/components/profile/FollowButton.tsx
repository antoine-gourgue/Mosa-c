"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";
import { toggleFollow } from "@/server/actions/follows";

/**
 * Size preset of the follow button.
 */
export type FollowButtonSize = "sm" | "md";

/**
 * Props for the {@link FollowButton} component.
 */
export type FollowButtonProps = {
  creatorId: string;
  initialFollowing: boolean;
  size?: FollowButtonSize;
};

const SIZE_CLASSES: Record<FollowButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
};

/**
 * Reusable Follow/Following toggle backed by the follow action, with optimistic
 * feedback.
 *
 * @param props - The creator id, initial state and size.
 * @returns The follow button element.
 */
export function FollowButton({
  creatorId,
  initialFollowing,
  size = "md",
}: FollowButtonProps): ReactElement {
  const [following, setFollowing] = useState(initialFollowing);
  const [, startTransition] = useTransition();

  const onToggle = (): void => {
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    startTransition(async () => {
      try {
        const result = await toggleFollow(creatorId);
        setFollowing(result.following);
      } catch {
        setFollowing(wasFollowing);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "cursor-pointer rounded-full font-semibold transition-colors duration-150",
        SIZE_CLASSES[size],
        following ? "bg-ink text-bg hover:bg-ink/90" : "bg-accent text-bg hover:bg-accent-press",
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
