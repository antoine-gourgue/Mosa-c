"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { useAuthPrompt } from "@/hooks/use-auth-prompt";
import { toggleBoardFollow } from "@/server/actions/board-follows";

/**
 * Props for the {@link BoardFollowButton} component.
 */
export type BoardFollowButtonProps = {
  boardId: string;
  initialFollowing: boolean;
  isAuthed?: boolean;
};

/**
 * Follow/Following toggle for a board, backed by the board-follow action with
 * optimistic feedback and rollback on failure. Following a board surfaces its
 * new pins in the viewer's "Following" feed.
 *
 * @param props - The board id, initial state and whether the viewer is signed in.
 * @returns The follow button element.
 */
export function BoardFollowButton({
  boardId,
  initialFollowing,
  isAuthed = true,
}: BoardFollowButtonProps): ReactElement {
  const t = useTranslations("board");
  const [following, setFollowing] = useState(initialFollowing);
  const [, startTransition] = useTransition();
  const withAuth = useAuthPrompt(isAuthed);

  const toggle = (): void => {
    withAuth(() => {
      const previous = following;
      setFollowing(!previous);
      startTransition(async () => {
        try {
          const result = await toggleBoardFollow(boardId);
          setFollowing(result.following);
        } catch {
          setFollowing(previous);
        }
      });
    });
  };

  return (
    <Button variant={following ? "dark" : "accent"} size="sm" onClick={toggle}>
      {following ? t("following") : t("follow")}
    </Button>
  );
}
