import type { ReactElement } from "react";

/**
 * Props for the {@link AdminPlaceholder} component.
 */
export type AdminPlaceholderProps = {
  title: string;
};

/**
 * Placeholder for admin sections that are not built yet, keeping the sidebar
 * navigation reachable without dead links. Replaced as each section ships.
 *
 * @param props - The section title.
 * @returns The placeholder element.
 */
export function AdminPlaceholder({ title }: AdminPlaceholderProps): ReactElement {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-extrabold text-ink">{title}</h1>
      <p className="mt-2 text-ink-soft">This section is coming soon.</p>
    </div>
  );
}
