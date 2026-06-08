"use client";

import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { useFollow } from "@/components/engagement";

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
  isAuthed?: boolean;
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
  isAuthed = true,
}: FollowButtonProps): ReactElement {
  const { following, toggle } = useFollow(creatorId, initialFollowing, isAuthed);

  return (
    <Button variant={following ? "dark" : "accent"} size={size} onClick={toggle}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
