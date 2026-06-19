import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import { searchTagResults } from "@/server/services";

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
    <ul className="mx-auto flex max-w-xl flex-col gap-1">
      {tags.map((tag) => (
        <li key={tag.id}>
          <Link
            href={`/tag/${tag.slug}`}
            className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface"
          >
            <div className="flex shrink-0 gap-1">
              {tag.previewUrls.length > 0 ? (
                tag.previewUrls.map((url, index) => (
                  <span
                    key={index}
                    className="relative size-12 overflow-hidden rounded-lg bg-surface"
                  >
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
              <p className="truncate text-sm text-ink-soft">
                {t("tagPins", { count: tag.pinCount })}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
