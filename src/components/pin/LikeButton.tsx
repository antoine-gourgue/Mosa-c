"use client";

import { useState, useTransition } from "react";
import type { MouseEvent, ReactElement } from "react";
import { useAuthPrompt } from "@/hooks/use-auth-prompt";
import { HeartFilledIcon, HeartIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { toggleLike } from "@/server/actions/likes";

/**
 * Props for the {@link LikeButton} component.
 */
export type LikeButtonProps = {
  pinId: string;
  initialLiked: boolean;
  initialCount: number;
  size?: number;
  className?: string;
  isAuthed?: boolean;
};

/**
 * Heart toggle with a like count. Updates optimistically, persists through the
 * like action and rolls back on error.
 *
 * @param props - The pin id, initial state, icon size and extra classes.
 * @returns The like button element.
 */
export function LikeButton({
  pinId,
  initialLiked,
  initialCount,
  size = 22,
  className,
  isAuthed = true,
}: LikeButtonProps): ReactElement {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [, startTransition] = useTransition();
  const withAuth = useAuthPrompt(isAuthed);

  const onClick = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    withAuth(() => {
      const wasLiked = liked;
      setLiked(!wasLiked);
      setCount((value) => value + (wasLiked ? -1 : 1));
      startTransition(async () => {
        try {
          const result = await toggleLike(pinId);
          setLiked(result.liked);
          setCount(result.count);
        } catch {
          setLiked(wasLiked);
          setCount((value) => value + (wasLiked ? 1 : -1));
        }
      });
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full text-ink transition-colors hover:bg-surface",
        className,
      )}
    >
      {liked ? <HeartFilledIcon size={size} className="text-accent" /> : <HeartIcon size={size} />}
      {count > 0 ? <span className="text-sm font-semibold">{count}</span> : null}
    </button>
  );
}
