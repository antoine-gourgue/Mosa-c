/**
 * Converts a label into a URL-friendly slug: lowercased, with non-alphanumeric
 * runs collapsed to single hyphens and leading/trailing hyphens trimmed.
 *
 * @param label - The human-readable label.
 * @returns The kebab-case slug.
 */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
