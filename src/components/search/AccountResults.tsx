import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactElement } from "react";
import { Avatar } from "@/components/ui";
import { FollowButton } from "@/components/profile";
import { getCurrentUser } from "@/lib/auth";
import { getFollowedCreatorIds, searchUsers } from "@/server/services";

/**
 * Props for the {@link AccountResults} component.
 */
export type AccountResultsProps = {
  query: string;
};

/**
 * The "Accounts" search tab: matching creators as profile rows — avatar, name,
 * @handle — each with a Follow toggle and linking to the profile. Shows a
 * friendly empty state when nothing matches.
 *
 * @param props - The active search query.
 * @returns The accounts results element.
 */
export async function AccountResults({ query }: AccountResultsProps): Promise<ReactElement> {
  const t = await getTranslations("search");
  const user = await getCurrentUser();
  const [creators, followedIds] = await Promise.all([
    searchUsers(query, user?.id ?? null),
    user === null ? Promise.resolve<string[]>([]) : getFollowedCreatorIds(user.id),
  ]);

  if (creators.length === 0) {
    return <div className="mt-16 text-center text-ink-soft">{t("noAccounts", { query })}</div>;
  }

  const followed = new Set(followedIds);
  return (
    <ul className="mx-auto flex max-w-xl flex-col gap-1">
      {creators.map((creator) => (
        <li
          key={creator.id}
          className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface"
        >
          <Link
            href={creator.username !== null ? `/u/${creator.username}` : "#"}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <Avatar
              src={creator.avatarUrl ?? undefined}
              name={creator.name}
              size={48}
              verified={creator.verified}
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{creator.name}</p>
              {creator.username !== null ? (
                <p className="truncate text-sm text-ink-soft">@{creator.username}</p>
              ) : null}
            </div>
          </Link>
          <div className="shrink-0">
            <FollowButton
              creatorId={creator.id}
              initialState={followed.has(creator.id) ? "following" : "none"}
              isPrivate={creator.isPrivate}
              size="sm"
              isAuthed={user !== null}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
