import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getFollowedCreatorIds, searchTagResults, searchUsers } from "@/server/services";
import { AccountRow } from "./AccountResults";
import { TagRow } from "./TagResults";

/**
 * Props for the {@link SearchTopSections} component.
 */
export type SearchTopSectionsProps = {
  query: string;
};

const TOP_LIMIT = 3;

/**
 * Section header with a title and a "See all" link to the dedicated tab.
 *
 * @param props - The title, the destination href and the "see all" label.
 * @returns The section header element.
 */
function SectionHeader({
  title,
  href,
  seeAll,
}: {
  title: string;
  href: string;
  seeAll: string;
}): ReactElement {
  return (
    <div className="mb-1 flex items-center justify-between px-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">{title}</h2>
      <Link href={href} className="text-sm font-semibold text-accent hover:underline">
        {seeAll}
      </Link>
    </div>
  );
}

/**
 * The blended "Top" tab sections: the most relevant accounts and tags in
 * compact lists above the pins grid, each linking through to its dedicated tab.
 * Renders nothing when there are neither account nor tag matches.
 *
 * @param props - The active search query.
 * @returns The top sections element, or null when empty.
 */
export async function SearchTopSections({
  query,
}: SearchTopSectionsProps): Promise<ReactElement | null> {
  const user = await getCurrentUser();
  const [creators, followedIds, tags] = await Promise.all([
    searchUsers(query, user?.id ?? null, TOP_LIMIT),
    user === null ? Promise.resolve<string[]>([]) : getFollowedCreatorIds(user.id),
    searchTagResults(query, TOP_LIMIT),
  ]);

  if (creators.length === 0 && tags.length === 0) {
    return null;
  }

  const t = await getTranslations("search");
  const followed = new Set(followedIds);
  const tabHref = (type: string): string => `/search?q=${encodeURIComponent(query)}&type=${type}`;

  return (
    <div className="mb-6 flex flex-col gap-6">
      {creators.length > 0 ? (
        <section>
          <SectionHeader title={t("tabAccounts")} href={tabHref("accounts")} seeAll={t("seeAll")} />
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
            {creators.map((creator) => (
              <AccountRow
                key={creator.id}
                creator={creator}
                following={followed.has(creator.id)}
                isAuthed={user !== null}
              />
            ))}
          </ul>
        </section>
      ) : null}
      {tags.length > 0 ? (
        <section>
          <SectionHeader title={t("tabTags")} href={tabHref("tags")} seeAll={t("seeAll")} />
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
            {tags.map((tag) => (
              <TagRow key={tag.id} tag={tag} pinsLabel={t("tagPins", { count: tag.pinCount })} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
