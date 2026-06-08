"use client";

import type { ReactElement } from "react";
import { useFollowOverride } from "@/components/engagement";

/**
 * Props for the {@link FollowerCount} component.
 */
export type FollowerCountProps = {
  creatorId: string;
  followers: number;
  initialFollowing: boolean;
};

/**
 * Reactive follower count for a profile header: reads the shared follow override
 * so the number reflects a Follow/Unfollow performed anywhere (profile, pin
 * detail, suggestions) without a reload, adjusting the server count by one when
 * the current state differs from the server-rendered one.
 *
 * @param props - The creator id, the server follower count and the initial
 *   follow state.
 * @returns The follower count span.
 */
export function FollowerCount({
  creatorId,
  followers,
  initialFollowing,
}: FollowerCountProps): ReactElement {
  const override = useFollowOverride(creatorId);
  const delta = override === undefined || override === initialFollowing ? 0 : override ? 1 : -1;
  return <span className="font-semibold text-ink">{followers + delta}</span>;
}
