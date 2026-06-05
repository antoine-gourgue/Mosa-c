import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import type { Pin } from "@/types/domain";

/**
 * Props for the {@link InspirationRail} component.
 */
export type InspirationRailProps = {
  pins: Pin[];
};

/**
 * Horizontal snap-scrolling rail of inspiration cards. Each card shows the pin
 * image with a caption overlay and links to the pin detail.
 *
 * @param props - The pins to feature.
 * @returns The inspiration rail element.
 */
export function InspirationRail({ pins }: InspirationRailProps): ReactElement {
  return (
    <div className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
      {pins.map((pin) => (
        <Link
          key={pin.id}
          href={`/pin/${pin.id}`}
          className="group relative h-[230px] w-[340px] shrink-0 snap-start overflow-hidden rounded-3xl"
        >
          <Image
            src={pin.imageUrl}
            alt={pin.title}
            fill
            sizes="340px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4">
            <span className="text-base font-semibold text-bg">{pin.title}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
