import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getFollowedCreatorIds, getSuggestedCreators } from "@/server/services";
import { MiniCreator } from "./MiniCreator";

/**
 * Props for the {@link MoreLikeCreator} component.
 */
export type MoreLikeCreatorProps = {
  creatorName: string;
  excludeId: string;
};

/**
 * "More like {creator}" section: a grid of suggested creators, each with its
 * own follow toggle. Renders nothing when there are no suggestions.
 *
 * @param props - The current creator's name and id to exclude.
 * @returns The suggestions section, or null when empty.
 */
export async function MoreLikeCreator({
  creatorName,
  excludeId,
}: MoreLikeCreatorProps): Promise<ReactElement | null> {
  const user = await getCurrentUser();
  const [creators, followedIds] = await Promise.all([
    getSuggestedCreators(excludeId, 3),
    user === null ? Promise.resolve<string[]>([]) : getFollowedCreatorIds(user.id),
  ]);

  if (creators.length === 0) {
    return null;
  }

  const followed = new Set(followedIds);
  return (
    <div>
      <h2 className="font-bold text-ink">More like {creatorName}</h2>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {creators.map((creator) => (
          <MiniCreator
            key={creator.id}
            creator={creator}
            initialFollowing={followed.has(creator.id)}
          />
        ))}
      </div>
    </div>
  );
}
