import type { ReactElement } from "react";

/**
 * Props for the {@link PinDetail} component.
 */
export type PinDetailProps = {
  pinId: string;
};

/**
 * Pin detail content shared by the overlay and the standalone page. The full
 * two-column layout (media and info panel) is implemented in its own ticket.
 *
 * @param props - The id of the pin to display.
 * @returns The pin detail content.
 */
export function PinDetail({ pinId }: PinDetailProps): ReactElement {
  return <div className="grid min-h-[400px] place-items-center text-ink-soft">Pin {pinId}</div>;
}
