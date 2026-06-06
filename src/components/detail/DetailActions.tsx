"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { ConfirmDialog, Menu, useToast } from "@/components/ui";
import { LikeButton } from "@/components/pin";
import { DownloadIcon, MoreIcon, ShareIcon } from "@/icons";
import { downloadPin } from "@/lib/download";
import { pinUrl, sharePin } from "@/lib/share";
import { recordDownload } from "@/server/actions/downloads";
import { deletePin } from "@/server/actions/pins";
import { reportPin } from "@/server/actions/reports";
import type { MenuItem } from "@/components/ui";
import { SaveToBoard } from "./SaveToBoard";
import type { SaveBoardOption } from "./SaveToBoard";

/**
 * Props for the {@link DetailActions} component.
 */
export type DetailActionsProps = {
  pinId: string;
  title: string;
  imageUrl: string;
  link: string | null;
  initialLiked: boolean;
  likeCount: number;
  downloadCount: number;
  isOwner: boolean;
  boards: SaveBoardOption[];
};

/**
 * Action row of the pin detail: an overflow menu and Like on the left, Download,
 * Share, Visit and a board-targeted Save on the right. Downloading saves the
 * image and increments the pin's download count.
 *
 * @param props - The pin identity, link, engagement state and the user's boards.
 * @returns The actions row element.
 */
export function DetailActions({
  pinId,
  title,
  imageUrl,
  link,
  initialLiked,
  likeCount,
  downloadCount,
  isOwner,
  boards,
}: DetailActionsProps): ReactElement {
  const [downloads, setDownloads] = useState(downloadCount);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  const onShare = async (): Promise<void> => {
    const outcome = await sharePin({ url: pinUrl(pinId), title });
    if (outcome === "copied") {
      show({ title: "Link copied", description: title, img: imageUrl });
    }
  };

  const onCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(pinUrl(pinId));
    show({ title: "Link copied", description: title, img: imageUrl });
  };

  const onDownload = async (): Promise<void> => {
    try {
      await downloadPin({ url: imageUrl, title });
      setDownloads((value) => value + 1);
      const result = await recordDownload(pinId);
      setDownloads(result.count);
    } catch {
      show({ title: "Download failed", description: "Please try again." });
    }
  };

  const onReport = async (): Promise<void> => {
    try {
      await reportPin(pinId);
      show({ title: "Report received", description: "Thanks, we will review this Pin." });
    } catch {
      show({ title: "Could not report", description: "Please try again." });
    }
  };

  const onConfirmDelete = (): void => {
    startDelete(async () => {
      const result = await deletePin(pinId);
      if (result.ok) {
        setConfirmDelete(false);
        show({ title: "Pin deleted" });
        router.replace("/");
      } else {
        setConfirmDelete(false);
        show({ title: "Could not delete", description: result.error });
      }
    });
  };

  const menuItems: MenuItem[] = [
    { label: "Share", icon: <ShareIcon size={18} />, onSelect: () => void onShare() },
    { label: "Copy link", icon: <ShareIcon size={18} />, onSelect: () => void onCopyLink() },
    {
      label: "Download image",
      icon: <DownloadIcon size={18} />,
      onSelect: () => void onDownload(),
    },
    ...(link !== null
      ? [
          {
            label: "Visit site",
            onSelect: () => window.open(link, "_blank", "noopener,noreferrer"),
          },
        ]
      : []),
    isOwner
      ? { label: "Delete Pin", onSelect: () => setConfirmDelete(true), destructive: true }
      : { label: "Report Pin", onSelect: () => void onReport(), destructive: true },
  ];

  return (
    <>
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <LikeButton
            pinId={pinId}
            initialLiked={initialLiked}
            initialCount={likeCount}
            className="h-11 px-3"
          />
          {downloads > 0 ? (
            <span
              className="inline-flex items-center gap-1 px-1 text-[13px] font-medium text-ink-soft"
              aria-label={`${downloads} downloads`}
            >
              <DownloadIcon size={16} />
              {downloads}
            </span>
          ) : null}
          <Menu label="More options" icon={<MoreIcon />} align="start" items={menuItems} />
        </div>
        {boards.length > 0 ? (
          <SaveToBoard pinId={pinId} title={title} imageUrl={imageUrl} boards={boards} />
        ) : null}
      </div>
    </>
  );
}
