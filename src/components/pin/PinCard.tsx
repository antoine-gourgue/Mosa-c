"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { MouseEvent, ReactElement } from "react";
import { Avatar, ConfirmDialog, IconButton, Menu, useToast } from "@/components/ui";
import type { MenuItem } from "@/components/ui";
import { useEngagementActions, usePinOverride } from "@/components/engagement";
import {
  CommentIcon,
  DownloadIcon,
  HeartFilledIcon,
  HeartIcon,
  LinkIcon,
  MoreIcon,
  StackIcon,
} from "@/icons";
import { cn } from "@/lib/cn";
import { downloadPin } from "@/lib/download";
import { pinUrl } from "@/lib/share";
import { recordDownload } from "@/server/actions/downloads";
import { deletePin } from "@/server/actions/pins";
import { reportPin } from "@/server/actions/reports";
import type { Pin } from "@/types/domain";

/**
 * Props for the {@link PinCard} component.
 */
export type PinCardProps = {
  pin: Pin;
  saved: boolean;
  onToggleSave: () => void;
  liked?: boolean;
  onToggleLike?: () => void;
  count?: number;
  canDelete?: boolean;
  onDeleted?: () => void;
};

/**
 * Pin card with a rounded image, hover overlay (More menu, a quick Like and
 * Save), an optional count badge and the title plus author meta. Like, comment
 * and download counts read from the shared engagement store so they stay in
 * sync with the pin detail overlay. The whole card links to the pin detail; the
 * overlay actions stop propagation so they do not navigate.
 *
 * @param props - The pin, its saved/liked state and the toggle handlers.
 * @returns The pin card element.
 */
export function PinCard({
  pin,
  saved,
  onToggleSave,
  liked = false,
  onToggleLike,
  count,
  canDelete = false,
  onDeleted,
}: PinCardProps): ReactElement {
  const override = usePinOverride(pin.id);
  const { setDownloadCount } = useEngagementActions();
  const likes = override.likeCount ?? pin.likeCount;
  const comments = override.commentCount ?? pin.commentCount;
  const downloads = override.downloadCount ?? pin.downloadCount;
  const { show } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();

  const stop = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(pinUrl(pin.id));
    show({ title: "Link copied", description: pin.title, img: pin.imageUrl });
  };

  const onDownload = async (): Promise<void> => {
    try {
      await downloadPin({ url: pin.imageUrl, title: pin.title });
      setDownloadCount(pin.id, downloads + 1);
      const result = await recordDownload(pin.id);
      setDownloadCount(pin.id, result.count);
    } catch {
      show({ title: "Download failed", description: "Please try again." });
    }
  };

  const onReport = async (): Promise<void> => {
    try {
      await reportPin(pin.id);
      show({ title: "Report received", description: "Thanks, we will review this Pin." });
    } catch {
      show({ title: "Could not report", description: "Please try again." });
    }
  };

  const onConfirmDelete = (): void => {
    startDelete(async () => {
      const result = await deletePin(pin.id);
      if (result.ok) {
        setConfirmDelete(false);
        show({ title: "Pin deleted" });
        onDeleted?.();
      } else {
        setConfirmDelete(false);
        show({ title: "Could not delete", description: result.error });
      }
    });
  };

  const menuItems: MenuItem[] = [
    { label: "Copy link", icon: <LinkIcon size={18} />, onSelect: () => void onCopyLink() },
    {
      label: "Download image",
      icon: <DownloadIcon size={18} />,
      onSelect: () => void onDownload(),
    },
    canDelete
      ? { label: "Delete Pin", onSelect: () => setConfirmDelete(true), destructive: true }
      : { label: "Report Pin", onSelect: () => void onReport(), destructive: true },
  ];

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
        <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 transition duration-150 group-hover:bg-ink/[0.28] group-hover:opacity-100 group-focus-within:opacity-100 max-md:hidden pointer-coarse:hidden">
          <div className="flex justify-end">
            <Menu
              label="More options"
              icon={<MoreIcon size={18} />}
              tone="solid"
              align="end"
              items={menuItems}
            />
          </div>
          <div className="flex items-center justify-between">
            <IconButton
              label={liked ? "Unlike" : "Like"}
              tone="solid"
              onClick={(event) => {
                stop(event);
                onToggleLike?.();
              }}
            >
              {liked ? (
                <HeartFilledIcon size={16} className="text-accent" />
              ) : (
                <HeartIcon size={16} />
              )}
            </IconButton>
            {canDelete ? (
              <span />
            ) : (
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
            )}
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
        {likes > 0 || comments > 0 || downloads > 0 ? (
          <div className="mt-1 flex items-center gap-3 text-[13px] text-ink-soft">
            {likes > 0 ? (
              <span className="inline-flex items-center gap-1">
                <HeartIcon size={14} />
                {likes}
              </span>
            ) : null}
            {comments > 0 ? (
              <span className="inline-flex items-center gap-1">
                <CommentIcon size={14} />
                {comments}
              </span>
            ) : null}
            {downloads > 0 ? (
              <span className="inline-flex items-center gap-1">
                <DownloadIcon size={14} />
                {downloads}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Pin?"
        description="This pin and its likes, comments and saves will be permanently removed."
        confirmLabel="Delete"
        destructive
        pending={deleting}
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
