import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { searchTagResults } from "@/server/services";
import type { TagResult } from "@/types/domain";

/**
 * A single tag search result row: a strip of preview thumbnails, the tag name
 * and its pin count, linking to the tag page. Shared by the Tags tab and the
 * Top tab.
 *
 * @param props - The tag result and its localized pin-count label.
 * @returns The tag row element.
 */
export function TagRow({ tag, pinsLabel }: { tag: TagResult; pinsLabel: string }): ReactElement {
  return (
    <li>
      <Link
        href={`/tag/${tag.slug}`}
        className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface"
      >
        <div className="flex shrink-0 gap-1">
          {tag.previewUrls.length > 0 ? (
            tag.previewUrls.map((url, index) => (
              <span key={index} className="relative size-12 overflow-hidden rounded-lg bg-surface">
                <Image src={url} alt="" fill sizes="48px" className="object-cover" />
              </span>
            ))
          ) : (
            <span className="grid size-12 place-items-center rounded-lg bg-surface text-lg font-bold text-ink-soft">
              #
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">#{tag.name}</p>
          <p className="truncate text-sm text-ink-soft">{pinsLabel}</p>
        </div>
      </Link>
    </li>
  );
}

/**
 * Props for the {@link TagResults} component.
 */
export type TagResultsProps = {
  query: string;
};

/**
 * The "Tags" search tab: matching tags as rows — a strip of preview thumbnails,
 * the tag name and its pin count — each linking to the tag page. Shows a
 * friendly empty state when nothing matches.
 *
 * @param props - The active search query.
 * @returns The tag results element.
 */
export async function TagResults({ query }: TagResultsProps): Promise<ReactElement> {
  const t = await getTranslations("search");
  const tags = await searchTagResults(query);

  if (tags.length === 0) {
    return <div className="mt-16 text-center text-ink-soft">{t("noTags", { query })}</div>;
  }

  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
      {tags.map((tag) => (
        <TagRow key={tag.id} tag={tag} pinsLabel={t("tagPins", { count: tag.pinCount })} />
      ))}
    </ul>
  );
}
