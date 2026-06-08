"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { useAuthPrompt } from "@/hooks/use-auth-prompt";
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
  const [following, setFollowing] = useState(initialFollowing);
  const [, startTransition] = useTransition();
  const withAuth = useAuthPrompt(isAuthed);

  const onToggle = (): void => {
    withAuth(() => {
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
    });
  };

  return (
    <Button variant={following ? "dark" : "accent"} size={size} onClick={onToggle}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
