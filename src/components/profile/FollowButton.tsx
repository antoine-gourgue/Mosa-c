"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import { useFollow } from "@/components/engagement";
import type { FollowState } from "@/types/domain";

/**
 * Size preset of the follow button.
 */
export type FollowButtonSize = "sm" | "md";

/**
 * Props for the {@link FollowButton} component.
 */
export type FollowButtonProps = {
  creatorId: string;
  initialState: FollowState;
  isPrivate?: boolean;
  size?: FollowButtonSize;
  isAuthed?: boolean;
};

/**
 * Reusable Follow/Requested/Following toggle backed by the follow action, with
 * optimistic feedback. A pending request (for private creators) reads
 * "Requested" and tapping it again cancels the request.
 *
 * @param props - The creator id, initial state, privacy and size.
 * @returns The follow button element.
 */
export function FollowButton({
  creatorId,
  initialState,
  isPrivate = false,
  size = "md",
  isAuthed = true,
}: FollowButtonProps): ReactElement {
  const t = useTranslations("profile");
  const { status, toggle } = useFollow(creatorId, initialState, isAuthed, isPrivate);
  const label =
    status === "following" ? t("following") : status === "requested" ? t("requested") : t("follow");

  return (
    <Button variant={status === "none" ? "accent" : "dark"} size={size} onClick={toggle}>
      {label}
    </Button>
  );
}
