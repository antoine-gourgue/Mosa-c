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
};

/**
 * Client masonry feed of pins. Toggling a save updates the UI optimistically,
 * persists through the save action (rolling back on error) and shows the
 * "Saved to Quick Saves" toast.
 *
 * @param props - The pins, the initially saved ids and the minimum column width.
 * @returns The feed element.
 */
export function PinFeed({ pins, savedIds, min = 220 }: PinFeedProps): ReactElement {
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

  return (
    <div ref={scope}>
      <Masonry min={min}>
        {pins.map((pin) => (
          <PinCard
            key={pin.id}
            pin={pin}
            saved={saved.has(pin.id)}
            onToggleSave={() => handleToggle(pin)}
          />
        ))}
      </Masonry>
    </div>
  );
}
