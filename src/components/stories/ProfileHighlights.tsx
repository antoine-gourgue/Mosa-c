import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getHighlights } from "@/server/services";
import { HighlightsRail } from "./HighlightsRail";

/**
 * Props for the {@link ProfileHighlights} component.
 */
export type ProfileHighlightsProps = {
  ownerId: string;
};

/**
 * Server wrapper loading a profile's story highlights and rendering the rail.
 * Renders nothing when the profile has no highlights.
 *
 * @param props - The profile owner's user id.
 * @returns The highlights rail, or null.
 */
export async function ProfileHighlights({
  ownerId,
}: ProfileHighlightsProps): Promise<ReactElement | null> {
  const [highlights, viewer] = await Promise.all([getHighlights(ownerId), getCurrentUser()]);
  if (highlights.length === 0) {
    return null;
  }
  return (
    <HighlightsRail
      highlights={highlights}
      viewerId={viewer?.id ?? ""}
      canManage={viewer?.id === ownerId}
    />
  );
}
