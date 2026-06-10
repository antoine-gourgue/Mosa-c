import type { ReactElement, ReactNode } from "react";

/**
 * Props for the {@link SettingsSection} component.
 */
export type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * A settings section shell with a consistent title and optional description
 * above its content, matching the heading style used across the hub.
 *
 * @param props - The section title, optional description and content.
 * @returns The section element.
 */
export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps): ReactElement {
  return (
    <section>
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      {description !== undefined ? (
        <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
