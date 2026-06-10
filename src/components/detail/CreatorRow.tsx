"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactElement } from "react";
import { Avatar, Button } from "@/components/ui";
import { useFollow } from "@/components/engagement";
import { cn } from "@/lib/cn";
import type { Creator, FollowState } from "@/types/domain";

/**
 * Props for the {@link CreatorRow} component.
 */
export type CreatorRowProps = {
  creator: Creator;
  initialState: FollowState;
  isSelf?: boolean;
  followers: number;
  isAuthed?: boolean;
  centered?: boolean;
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
  initialState,
  isSelf = false,
  followers,
  isAuthed = true,
  centered = false,
}: CreatorRowProps): ReactElement {
  const t = useTranslations("profile");
  const { status, toggle } = useFollow(creator.id, initialState, isAuthed, creator.isPrivate);
  const following = status === "following";
  const wasFollowing = initialState === "following";
  const followerCount = followers + (following === wasFollowing ? 0 : following ? 1 : -1);

  return (
    <div className={cn("flex items-center gap-3", centered && "justify-center")}>
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
            {t("followerCount", { count: followerCount })}
          </span>
        </div>
      </Link>
      {isSelf ? null : (
        <Button
          variant={status === "none" ? "ghost" : "dark"}
          className={centered ? "" : "ml-auto"}
          onClick={toggle}
        >
          {status === "following"
            ? t("following")
            : status === "requested"
              ? t("requested")
              : t("follow")}
        </Button>
      )}
    </div>
  );
}
