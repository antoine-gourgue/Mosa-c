import type { ReactElement } from "react";
import { getCreatorById, getStoryReel } from "@/server/services";
import { StoriesRail } from "./StoriesRail";

/**
 * Props for the {@link StoriesReel} component.
 */
export type StoriesReelProps = {
  viewerId: string;
};

/**
 * Server wrapper that loads the viewer's story reel and their own identity, then
 * renders the {@link StoriesRail}. The rail always shows at least the viewer's
 * own ring, so this renders whenever there is a signed-in viewer.
 *
 * @param props - The current viewer id.
 * @returns The story rail, or null when the viewer can't be loaded.
 */
export async function StoriesReel({ viewerId }: StoriesReelProps): Promise<ReactElement | null> {
  const [reel, viewer] = await Promise.all([getStoryReel(viewerId), getCreatorById(viewerId)]);
  if (viewer === null) {
    return null;
  }
  return (
    <StoriesRail
      reel={reel}
      viewer={{
        id: viewer.id,
        name: viewer.name,
        avatarUrl: viewer.avatarUrl,
        verified: viewer.verified,
      }}
    />
  );
}
