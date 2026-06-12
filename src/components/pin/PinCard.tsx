"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { MouseEvent, ReactElement } from "react";
import { Avatar, Button, ConfirmDialog, IconButton, Menu, useToast } from "@/components/ui";
import type { MenuItem } from "@/components/ui";
import { useEngagementActions, usePinOverride } from "@/components/engagement";
import {
  CommentIcon,
  ComposeIcon,
  DownloadIcon,
  FlagIcon,
  HeartFilledIcon,
  HeartIcon,
  LinkIcon,
  MapPinIcon,
  MoreIcon,
  StackIcon,
  TrashIcon,
} from "@/icons";
import { downloadPin } from "@/lib/download";
import { pinUrl } from "@/lib/share";
import { recordDownload } from "@/server/actions/downloads";
import { deletePin } from "@/server/actions/pins";
import { reportPin } from "@/server/actions/reports";
import type { Pin } from "@/types/domain";
import { EditPinDialog } from "./EditPinDialog";

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
  const t = useTranslations("pin");
  const override = usePinOverride(pin.id);
  const { setDownloadCount } = useEngagementActions();
  const likes = override.likeCount ?? pin.likeCount;
  const comments = override.commentCount ?? pin.commentCount;
  const downloads = override.downloadCount ?? pin.downloadCount;
  const { show } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  const stop = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  const onCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(pinUrl(pin.id));
    show({ title: t("linkCopied"), description: pin.title, img: pin.imageUrl });
  };

  const onDownload = async (): Promise<void> => {
    try {
      await downloadPin({ url: pin.imageUrl, title: pin.title });
      setDownloadCount(pin.id, downloads + 1);
      const result = await recordDownload(pin.id);
      setDownloadCount(pin.id, result.count);
    } catch {
      show({ title: t("downloadFailed"), description: t("tryAgain") });
    }
  };

  const onReport = async (): Promise<void> => {
    try {
      await reportPin(pin.id);
      show({ title: t("reportReceived"), description: t("reportThanks") });
    } catch {
      show({ title: t("reportFailed"), description: t("tryAgain") });
    }
  };

  const onConfirmDelete = (): void => {
    startDelete(async () => {
      const result = await deletePin(pin.id);
      if (result.ok) {
        setConfirmDelete(false);
        show({ title: t("pinDeleted") });
        onDeleted?.();
      } else {
        setConfirmDelete(false);
        show({ title: t("deleteFailed"), description: result.error });
      }
    });
  };

  const menuItems: MenuItem[] = [
    { label: t("copyLink"), icon: <LinkIcon size={18} />, onSelect: () => void onCopyLink() },
    {
      label: t("downloadImage"),
      icon: <DownloadIcon size={18} />,
      onSelect: () => void onDownload(),
    },
    ...(canDelete
      ? [
          {
            label: t("editPin"),
            icon: <ComposeIcon size={18} />,
            onSelect: () => setEditOpen(true),
          },
          {
            label: t("deletePin"),
            icon: <TrashIcon size={18} />,
            onSelect: () => setConfirmDelete(true),
            destructive: true,
          },
        ]
      : [
          {
            label: t("reportPin"),
            icon: <FlagIcon size={18} />,
            onSelect: () => void onReport(),
            destructive: true,
          },
        ]),
  ];

  return (
    <div data-pin-card className="mb-4 break-inside-avoid">
      <Link
        href={`/pin/${pin.id}`}
        className="group relative block overflow-hidden rounded-pin bg-surface"
      >
        <Image
          src={pin.imageUrl}
          alt={pin.altText ?? pin.title}
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
              label={t("moreOptions")}
              icon={<MoreIcon size={18} />}
              tone="solid"
              align="end"
              items={menuItems}
            />
          </div>
          <div className="flex items-center justify-between">
            <IconButton
              label={liked ? t("unlike") : t("like")}
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
              <Button
                type="button"
                variant={saved ? "dark" : "accent"}
                size="sm"
                className="h-10"
                onClick={(event) => {
                  stop(event);
                  onToggleSave();
                }}
              >
                {saved ? t("saved") : t("save")}
              </Button>
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
        {pin.place !== null ? (
          <div className="mt-1 flex items-center gap-1 text-[13px] text-ink-soft">
            <MapPinIcon size={13} className="shrink-0" />
            <span className="truncate">{pin.place.name}</span>
          </div>
        ) : null}
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
        title={t("deleteTitle")}
        description={t("deleteBody")}
        confirmLabel={t("delete")}
        destructive
        pending={deleting}
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {canDelete ? (
        <EditPinDialog
          pinId={pin.id}
          initialTitle={pin.title}
          initialDescription={pin.description ?? ""}
          initialLink={pin.link ?? ""}
          initialTags={pin.tags.map((tag) => tag.name)}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </div>
  );
}
