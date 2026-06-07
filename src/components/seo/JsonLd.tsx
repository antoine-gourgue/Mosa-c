import type { ReactElement } from "react";

/**
 * Props for the {@link JsonLd} component.
 */
export type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * Renders a JSON-LD structured-data script. The data is application-controlled,
 * so serializing it into the script is safe.
 *
 * @param props - The structured-data object.
 * @returns The script element.
 */
export function JsonLd({ data }: JsonLdProps): ReactElement {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
