import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactElement } from "react";
import { Avatar } from "@/components/ui";
import { FollowButton } from "@/components/profile";
import type { Creator } from "@/types/domain";

/**
 * A suggested creator with the viewer's follow state.
 */
export type SuggestedCreator = {
  creator: Creator;
  following: boolean;
};

/**
 * Props for the {@link SuggestedCreators} component.
 */
export type SuggestedCreatorsProps = {
  creators: SuggestedCreator[];
};

/**
 * Sidebar panel listing creators to discover, each with an avatar, handle and a
 * follow toggle. Renders nothing when there are no suggestions.
 *
 * @param props - The suggested creators with their follow state.
 * @returns The suggestions panel, or null when empty.
 */
export async function SuggestedCreators({
  creators,
}: SuggestedCreatorsProps): Promise<ReactElement | null> {
  if (creators.length === 0) {
    return null;
  }
  const t = await getTranslations("notifications");
  return (
    <div className="rounded-3xl bg-surface p-5">
      <h2 className="mb-4 text-lg font-bold text-ink">{t("discoverCreators")}</h2>
      <ul className="flex flex-col gap-4">
        {creators.map(({ creator, following }) => (
          <li key={creator.id} className="flex items-center gap-3">
            <Link
              href={creator.username !== null ? `/u/${creator.username}` : "#"}
              className="flex min-w-0 items-center gap-3"
            >
              <Avatar
                src={creator.avatarUrl ?? undefined}
                name={creator.name}
                size={44}
                verified={creator.verified}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{creator.name}</p>
                {creator.username !== null ? (
                  <p className="truncate text-sm text-ink-soft">@{creator.username}</p>
                ) : null}
              </div>
            </Link>
            <div className="ml-auto shrink-0">
              <FollowButton
                creatorId={creator.id}
                initialState={following ? "following" : "none"}
                isPrivate={creator.isPrivate}
                size="sm"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
