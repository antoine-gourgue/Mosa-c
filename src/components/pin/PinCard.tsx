"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent, ReactElement } from "react";
import { Avatar, IconButton, useToast } from "@/components/ui";
import { CommentIcon, DownloadIcon, HeartIcon, MoreIcon, ShareIcon, StackIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { pinUrl, sharePin } from "@/lib/share";
import type { Pin } from "@/types/domain";

/**
 * Props for the {@link PinCard} component.
 */
export type PinCardProps = {
  pin: Pin;
  saved: boolean;
  onToggleSave: () => void;
  count?: number;
};

/**
 * Pin card with a rounded image, hover overlay (More, Save and Share), an
 * optional count badge and the title plus author meta. The whole card links to
 * the pin detail; the overlay actions stop propagation so they do not navigate.
 *
 * @param props - The pin, its saved state and the save toggle handler.
 * @returns The pin card element.
 */
export function PinCard({ pin, saved, onToggleSave, count }: PinCardProps): ReactElement {
  const { show } = useToast();

  const stop = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onShare = async (event: MouseEvent<HTMLButtonElement>): Promise<void> => {
    stop(event);
    const outcome = await sharePin({ url: pinUrl(pin.id), title: pin.title });
    if (outcome === "copied") {
      show({ title: "Link copied", description: pin.title, img: pin.imageUrl });
    }
  };

  return (
    <div data-pin-card className="mb-4 break-inside-avoid">
      <Link
        href={`/pin/${pin.id}`}
        className="group relative block overflow-hidden rounded-pin bg-surface"
      >
        <Image
          src={pin.imageUrl}
          alt={pin.title}
          width={pin.width}
          height={pin.height}
          sizes="(max-width: 768px) 50vw, 20vw"
          className="w-full"
        />
        {count !== undefined && count > 1 ? (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/60 px-2 py-1 text-xs font-semibold text-bg backdrop-blur">
            <StackIcon size={14} />
            {count}
          </div>
        ) : null}
        <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 transition duration-150 group-hover:bg-ink/[0.28] group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100">
          <div className="flex justify-end">
            <IconButton label="More" tone="solid" onClick={stop}>
              <MoreIcon size={18} />
            </IconButton>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={(event) => {
                stop(event);
                onToggleSave();
              }}
              className={cn(
                "h-10 cursor-pointer rounded-full px-4 text-sm font-semibold text-bg transition-colors duration-150",
                saved ? "bg-ink hover:bg-ink/90" : "bg-accent hover:bg-accent-press",
              )}
            >
              {saved ? "Saved" : "Save"}
            </button>
            <IconButton label="Share" tone="solid" onClick={(event) => void onShare(event)}>
              <ShareIcon size={16} />
            </IconButton>
          </div>
        </div>
      </Link>

      <div className="px-1 pt-2">
        <p className="line-clamp-2 text-[15px] font-semibold text-ink">{pin.title}</p>
        {pin.creator.username !== null ? (
          <Link
            href={`/u/${pin.creator.username}`}
            className="mt-1 flex w-fit items-center gap-1.5 hover:underline"
          >
            <Avatar src={pin.creator.avatarUrl ?? undefined} name={pin.creator.name} size={22} />
            <span className="text-[13px] text-ink-soft">{pin.creator.name}</span>
          </Link>
        ) : (
          <div className="mt-1 flex items-center gap-1.5">
            <Avatar src={pin.creator.avatarUrl ?? undefined} name={pin.creator.name} size={22} />
            <span className="text-[13px] text-ink-soft">{pin.creator.name}</span>
          </div>
        )}
        {pin.likeCount > 0 || pin.commentCount > 0 || pin.downloadCount > 0 ? (
          <div className="mt-1 flex items-center gap-3 text-[13px] text-ink-faint">
            {pin.likeCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <HeartIcon size={14} />
                {pin.likeCount}
              </span>
            ) : null}
            {pin.commentCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <CommentIcon size={14} />
                {pin.commentCount}
              </span>
            ) : null}
            {pin.downloadCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                <DownloadIcon size={14} />
                {pin.downloadCount}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
