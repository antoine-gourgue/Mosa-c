"use client";

import { useTransition } from "react";
import { useAuthPrompt } from "@/hooks/use-auth-prompt";
import { toggleFollow } from "@/server/actions/follows";
import type { FollowState } from "@/types/domain";
import { useEngagementActions, useFollowOverride } from "./EngagementProvider";

/**
 * Shared follow state for a creator, backed by the engagement store so the
 * Follow toggle stays in sync wherever the creator appears (pin detail modal,
 * pin page, profile, suggestions). Reads the store override when present and
 * falls back to the server-rendered initial state, and toggles optimistically
 * with rollback on failure.
 *
 * The next state is predicted client-side from the creator's privacy: a private
 * creator yields a pending request rather than an immediate follow. The server
 * remains the source of truth and reconciles the prediction on completion.
 *
 * @param creatorId - The creator to act on.
 * @param initialState - The server-rendered follow state.
 * @param isAuthed - Whether the viewer is signed in; gates the action behind the
 *   auth prompt when false.
 * @param isPrivate - Whether the creator's account is private.
 * @returns The current follow state and a toggle handler.
 */
export function useFollow(
  creatorId: string,
  initialState: FollowState,
  isAuthed = true,
  isPrivate = false,
): { status: FollowState; toggle: () => void } {
  const override = useFollowOverride(creatorId);
  const { setFollowing } = useEngagementActions();
  const [, startTransition] = useTransition();
  const withAuth = useAuthPrompt(isAuthed);
  const status = override ?? initialState;

  const toggle = (): void => {
    withAuth(() => {
      const previous = status;
      const optimistic: FollowState =
        previous === "none" ? (isPrivate ? "requested" : "following") : "none";
      setFollowing(creatorId, optimistic);
      startTransition(async () => {
        try {
          const result = await toggleFollow(creatorId);
          setFollowing(creatorId, result.status);
        } catch {
          setFollowing(creatorId, previous);
        }
      });
    });
  };

  return { status, toggle };
}
