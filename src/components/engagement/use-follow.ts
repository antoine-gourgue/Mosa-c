"use client";

import { useTransition } from "react";
import { useAuthPrompt } from "@/hooks/use-auth-prompt";
import { toggleFollow } from "@/server/actions/follows";
import { useEngagementActions, useFollowOverride } from "./EngagementProvider";

/**
 * Shared follow state for a creator, backed by the engagement store so the
 * Follow toggle stays in sync wherever the creator appears (pin detail modal,
 * pin page, profile, suggestions). Reads the store override when present and
 * falls back to the server-rendered initial state, and toggles optimistically
 * with rollback on failure.
 *
 * @param creatorId - The creator to follow or unfollow.
 * @param initialFollowing - The server-rendered follow state.
 * @param isAuthed - Whether the viewer is signed in; gates the action behind the
 *   auth prompt when false.
 * @returns The current follow state and a toggle handler.
 */
export function useFollow(
  creatorId: string,
  initialFollowing: boolean,
  isAuthed = true,
): { following: boolean; toggle: () => void } {
  const override = useFollowOverride(creatorId);
  const { setFollowing } = useEngagementActions();
  const [, startTransition] = useTransition();
  const withAuth = useAuthPrompt(isAuthed);
  const following = override ?? initialFollowing;

  const toggle = (): void => {
    withAuth(() => {
      const wasFollowing = following;
      setFollowing(creatorId, !wasFollowing);
      startTransition(async () => {
        try {
          const result = await toggleFollow(creatorId);
          setFollowing(creatorId, result.following);
        } catch {
          setFollowing(creatorId, wasFollowing);
        }
      });
    });
  };

  return { following, toggle };
}
