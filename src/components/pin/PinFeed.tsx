"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { useToast } from "@/components/ui";
import { useEngagement } from "@/components/engagement";
import { useAuthPrompt } from "@/hooks/use-auth-prompt";
import { DURATION, gsap, useGSAP } from "@/lib/gsap";
import { toggleSave } from "@/server/actions/saves";
import { toggleLike } from "@/server/actions/likes";
import type { Pin } from "@/types/domain";
import { Masonry } from "./Masonry";
import { PinCard } from "./PinCard";

/**
 * Props for the {@link PinFeed} component.
 */
export type PinFeedProps = {
  pins: Pin[];
  savedIds: string[];
  likedIds?: string[];
  min?: number;
  viewerId?: string | null;
};

/**
 * Client masonry feed of pins. Save and like toggles are optimistic, persist
 * through their actions (rolling back on error) and are published to the shared
 * engagement store so they stay in sync with the pin detail overlay. When
 * `viewerId` matches a pin's creator, that card exposes a delete action and is
 * removed from the feed once deleted.
 *
 * @param props - The pins, the viewer's initially saved/liked ids, the minimum
 *   column width and the viewing user's id.
 * @returns The feed element.
 */
export function PinFeed({
  pins,
  savedIds,
  likedIds = [],
  min = 220,
  viewerId = null,
}: PinFeedProps): ReactElement {
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const items = pins.filter((pin) => !removedIds.has(pin.id));
  const [initialSaved] = useState(() => new Set(savedIds));
  const [initialLiked] = useState(() => new Set(likedIds));
  const { overrides, setSaved, setLike } = useEngagement();
  const [, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();
  const withAuth = useAuthPrompt(viewerId !== null);
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

  const isSaved = (pin: Pin): boolean => overrides.get(pin.id)?.saved ?? initialSaved.has(pin.id);

  const isLiked = (pin: Pin): boolean => overrides.get(pin.id)?.liked ?? initialLiked.has(pin.id);

  const handleToggleSave = (pin: Pin): void => {
    if (viewerId === null) {
      withAuth(() => undefined);
      return;
    }
    const wasSaved = isSaved(pin);
    setSaved(pin.id, !wasSaved);
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
        setSaved(pin.id, result.saved);
      } catch {
        setSaved(pin.id, wasSaved);
      }
    });
  };

  const handleToggleLike = (pin: Pin): void => {
    if (viewerId === null) {
      withAuth(() => undefined);
      return;
    }
    const wasLiked = isLiked(pin);
    const base = overrides.get(pin.id)?.likeCount ?? pin.likeCount;
    setLike(pin.id, !wasLiked, Math.max(0, base + (wasLiked ? -1 : 1)));
    startTransition(async () => {
      try {
        const result = await toggleLike(pin.id);
        setLike(pin.id, result.liked, result.count);
      } catch {
        setLike(pin.id, wasLiked, base);
      }
    });
  };

  const removePin = (id: string): void => {
    setRemovedIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  return (
    <div ref={scope}>
      <Masonry min={min}>
        {items.map((pin) => (
          <PinCard
            key={pin.id}
            pin={pin}
            saved={isSaved(pin)}
            onToggleSave={() => handleToggleSave(pin)}
            liked={isLiked(pin)}
            onToggleLike={() => handleToggleLike(pin)}
            canDelete={viewerId !== null && viewerId === pin.creator.id}
            onDeleted={() => removePin(pin.id)}
          />
        ))}
      </Masonry>
    </div>
  );
}
