"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { Masonry } from "./Masonry";
import { PinCard } from "./PinCard";
import type { Pin } from "@/types/domain";

/**
 * Props for the {@link PinFeed} component.
 */
export type PinFeedProps = {
  pins: Pin[];
  savedIds: string[];
  min?: number;
};

/**
 * Client masonry feed of pins. Holds the saved state locally for instant
 * feedback; the persistent save action and toast are wired in a later ticket.
 *
 * @param props - The pins, the initially saved ids and the minimum column width.
 * @returns The feed element.
 */
export function PinFeed({ pins, savedIds, min = 220 }: PinFeedProps): ReactElement {
  const [saved, setSaved] = useState<Set<string>>(() => new Set(savedIds));

  const toggle = (id: string): void => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Masonry min={min}>
      {pins.map((pin) => (
        <PinCard
          key={pin.id}
          pin={pin}
          saved={saved.has(pin.id)}
          onToggleSave={() => toggle(pin.id)}
        />
      ))}
    </Masonry>
  );
}
