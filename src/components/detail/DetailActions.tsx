"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, ConfirmDialog, Menu, useToast } from "@/components/ui";
import { LikeButton } from "@/components/pin";
import { useEngagementActions, usePinOverride } from "@/components/engagement";
import { useAuthPrompt } from "@/hooks/use-auth-prompt";
import { DownloadIcon, FlagIcon, LinkIcon, MoreIcon, TrashIcon } from "@/icons";
import { downloadPin } from "@/lib/download";
import { pinUrl } from "@/lib/share";
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
  isAuthed?: boolean;
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
  isAuthed = true,
}: DetailActionsProps): ReactElement {
  const override = usePinOverride(pinId);
  const { setDownloadCount } = useEngagementActions();
  const downloads = override.downloadCount ?? downloadCount;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const { show } = useToast();
  const router = useRouter();
  const withAuth = useAuthPrompt(isAuthed);

  const onCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(pinUrl(pinId));
    show({ title: "Link copied", description: title, img: imageUrl });
  };

  const onDownload = async (): Promise<void> => {
    try {
      await downloadPin({ url: imageUrl, title });
    } catch {
      show({ title: "Download failed", description: "Please try again." });
      return;
    }
    setDownloadCount(pinId, downloads + 1);
    try {
      const result = await recordDownload(pinId);
      setDownloadCount(pinId, result.count);
    } catch (recordError) {
      void recordError;
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
    { label: "Copy link", icon: <LinkIcon size={18} />, onSelect: () => void onCopyLink() },
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
      ? {
          label: "Delete Pin",
          icon: <TrashIcon size={18} />,
          onSelect: () => setConfirmDelete(true),
          destructive: true,
        }
      : {
          label: "Report Pin",
          icon: <FlagIcon size={18} />,
          onSelect: () => withAuth(() => void onReport()),
          destructive: true,
        },
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
            isAuthed={isAuthed}
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
        {!isOwner && isAuthed && boards.length > 0 ? (
          <SaveToBoard pinId={pinId} title={title} imageUrl={imageUrl} boards={boards} />
        ) : !isAuthed ? (
          <Button onClick={() => withAuth(() => undefined)}>Save</Button>
        ) : null}
      </div>
    </>
  );
}
