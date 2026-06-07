"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { useToast } from "@/components/ui";
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
  likedIds = [],
  min = 220,
  viewerId = null,
}: PinFeedProps): ReactElement {
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const items = pins.filter((pin) => !removedIds.has(pin.id));
  const [saved, setSaved] = useState<Set<string>>(() => new Set(savedIds));
  const [liked, setLiked] = useState<Set<string>>(() => new Set(likedIds));
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(() => new Map());
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
    if (viewerId === null) {
      withAuth(() => undefined);
      return;
    }
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

  const setLikedFlag = (id: string, value: boolean): void => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (value) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const setLikeCount = (id: string, value: number): void => {
    setLikeCounts((prev) => {
      const next = new Map(prev);
      next.set(id, value);
      return next;
    });
  };

  const handleToggleLike = (pin: Pin): void => {
    if (viewerId === null) {
      withAuth(() => undefined);
      return;
    }
    const wasLiked = liked.has(pin.id);
    const base = likeCounts.get(pin.id) ?? pin.likeCount;
    setLikedFlag(pin.id, !wasLiked);
    setLikeCount(pin.id, Math.max(0, base + (wasLiked ? -1 : 1)));
    startTransition(async () => {
      try {
        const result = await toggleLike(pin.id);
        setLikedFlag(pin.id, result.liked);
        setLikeCount(pin.id, result.count);
      } catch {
        setLikedFlag(pin.id, wasLiked);
        setLikeCount(pin.id, base);
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
            saved={saved.has(pin.id)}
            onToggleSave={() => handleToggle(pin)}
            liked={liked.has(pin.id)}
            likeCount={likeCounts.get(pin.id) ?? pin.likeCount}
            onToggleLike={() => handleToggleLike(pin)}
            canDelete={viewerId !== null && viewerId === pin.creator.id}
            onDeleted={() => removePin(pin.id)}
          />
        ))}
      </Masonry>
    </div>
  );
}
