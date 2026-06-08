import type { ReactElement } from "react";
import { Button } from "@/components/ui";
import type { TagWithCount } from "@/types/domain";

/**
 * Props for the {@link TagCloud} component.
 */
export type TagCloudProps = {
  tags: TagWithCount[];
};

/**
 * Discovery cloud of the most-used tags as ghost buttons, each showing how many
 * pins carry it. Clicking a tag opens its page.
 *
 * @param props - The popular tags to display.
 * @returns The tag cloud element.
 */
export function TagCloud({ tags }: TagCloudProps): ReactElement {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {tags.map((tag) => (
        <Button key={tag.id} href={`/tag/${tag.slug}`} variant="ghost" size="sm">
          #{tag.name}
          <span className="ml-1.5 font-medium text-ink-soft">{tag.pinCount}</span>
        </Button>
      ))}
    </div>
  );
}
