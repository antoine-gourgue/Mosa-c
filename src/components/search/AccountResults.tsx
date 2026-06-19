import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactElement } from "react";
import { Avatar } from "@/components/ui";
import { FollowButton } from "@/components/profile";
import { getCurrentUser } from "@/lib/auth";
import { getFollowedCreatorIds, searchUsers } from "@/server/services";
import type { Creator } from "@/types/domain";

/**
 * A single account search result row: avatar, name and @handle linking to the
 * profile, with a Follow toggle. Shared by the Accounts tab and the Top tab.
 *
 * @param props - The creator, the viewer's follow state and auth state.
 * @returns The account row element.
 */
export function AccountRow({
  creator,
  following,
  isAuthed,
}: {
  creator: Creator;
  following: boolean;
  isAuthed: boolean;
}): ReactElement {
  return (
    <li className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface">
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
          initialState={following ? "following" : "none"}
          isPrivate={creator.isPrivate}
          size="sm"
          isAuthed={isAuthed}
        />
      </div>
    </li>
  );
}

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
        <AccountRow
          key={creator.id}
          creator={creator}
          following={followed.has(creator.id)}
          isAuthed={user !== null}
        />
      ))}
    </ul>
  );
}
