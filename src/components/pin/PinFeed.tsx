"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { useToast } from "@/components/ui";
import { DURATION, gsap, useGSAP } from "@/lib/gsap";
import { toggleSave } from "@/server/actions/saves";
import type { Pin } from "@/types/domain";
import { Masonry } from "./Masonry";
import { PinCard } from "./PinCard";

/**
 * Props for the {@link PinFeed} component.
 */
export type PinFeedProps = {
  pins: Pin[];
  savedIds: string[];
  min?: number;
  viewerId?: string | null;
};

/**
 * Client masonry feed of pins. Toggling a save updates the UI optimistically,
 * persists through the save action (rolling back on error) and shows the
 * "Saved to Quick Saves" toast. When `viewerId` matches a pin's creator, that
 * card exposes a delete action and is removed from the feed once deleted.
 *
 * @param props - The pins, the initially saved ids, the minimum column width and
 *   the viewing user's id.
 * @returns The feed element.
 */
export function PinFeed({
  pins,
  savedIds,
  min = 220,
  viewerId = null,
}: PinFeedProps): ReactElement {
  const [items, setItems] = useState<Pin[]>(pins);
  const [saved, setSaved] = useState<Set<string>>(() => new Set(savedIds));
  const [, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-pin-card]", {
          y: 18,
          opacity: 0,
          duration: DURATION.base,
          stagger: 0.035,
          ease: "power2.out",
        });
      });
    },
    { scope },
  );

  const setSavedFlag = (id: string, value: boolean): void => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (value) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleToggle = (pin: Pin): void => {
    const wasSaved = saved.has(pin.id);
    setSavedFlag(pin.id, !wasSaved);
    if (!wasSaved) {
      show({
        title: "Saved to Quick Saves",
        description: pin.title,
        img: pin.imageUrl,
        action: { label: "View", onClick: () => router.push("/boards") },
      });
    }
    startTransition(async () => {
      try {
        const result = await toggleSave(pin.id);
        setSavedFlag(pin.id, result.saved);
      } catch {
        setSavedFlag(pin.id, wasSaved);
      }
    });
  };

  const removePin = (id: string): void => {
    setItems((current) => current.filter((pin) => pin.id !== id));
  };

  return (
    <div ref={scope}>
      <Masonry min={min}>
        {items.map((pin) => (
          <PinCard
            key={pin.id}
            pin={pin}
            saved={saved.has(pin.id)}
            onToggleSave={() => handleToggle(pin)}
            canDelete={viewerId !== null && viewerId === pin.creator.id}
            onDeleted={() => removePin(pin.id)}
          />
        ))}
      </Masonry>
    </div>
  );
}
