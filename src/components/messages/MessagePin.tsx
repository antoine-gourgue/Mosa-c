import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";

/**
 * Props for the {@link MessagePin} component.
 */
export type MessagePinProps = {
  pin: { id: string; imageUrl: string; title: string };
};

/**
 * A shared pin rendered inside a conversation: a compact, tappable card with the
 * pin's image and title that links to the pin. Used for messages that carry a
 * pin attachment instead of (or alongside) text.
 *
 * @param props - The shared pin.
 * @returns The pin attachment card.
 */
export function MessagePin({ pin }: MessagePinProps): ReactElement {
  return (
    <Link
      href={`/pin/${pin.id}`}
      className="block w-44 overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:bg-surface-2"
    >
      <div className="relative aspect-[4/3] w-full bg-surface-2">
        <Image src={pin.imageUrl} alt="" fill sizes="176px" className="object-cover" />
      </div>
      <p className="truncate px-3 py-2 text-[13px] font-semibold text-ink">{pin.title}</p>
    </Link>
  );
}
