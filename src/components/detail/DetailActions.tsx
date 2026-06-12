"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, ConfirmDialog, Menu, useToast } from "@/components/ui";
import { EditPinDialog, LikeButton } from "@/components/pin";
import { useEngagementActions, usePinOverride } from "@/components/engagement";
import { useAuthPrompt } from "@/hooks/use-auth-prompt";
import { ComposeIcon, DownloadIcon, FlagIcon, LinkIcon, MoreIcon, TrashIcon } from "@/icons";
import { downloadPin } from "@/lib/download";
import { pinUrl } from "@/lib/share";
import { recordDownload } from "@/server/actions/downloads";
import { deletePin } from "@/server/actions/pins";
import { reportPin } from "@/server/actions/reports";
import type { MenuItem } from "@/components/ui";
import type { PinPlace } from "@/types/domain";
import { SaveToBoard } from "./SaveToBoard";
import type { SaveBoardOption } from "./SaveToBoard";
import { SharePinMenu } from "./SharePinMenu";

/**
 * Props for the {@link DetailActions} component.
 */
export type DetailActionsProps = {
  pinId: string;
  title: string;
  description: string | null;
  tags: string[];
  imageUrl: string;
  link: string | null;
  place: PinPlace | null;
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
  description,
  tags,
  imageUrl,
  link,
  place,
  initialLiked,
  likeCount,
  downloadCount,
  isOwner,
  boards,
  isAuthed = true,
}: DetailActionsProps): ReactElement {
  const tp = useTranslations("pin");
  const td = useTranslations("detail");
  const override = usePinOverride(pinId);
  const { setDownloadCount } = useEngagementActions();
  const downloads = override.downloadCount ?? downloadCount;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const { show } = useToast();
  const router = useRouter();
  const withAuth = useAuthPrompt(isAuthed);

  const onCopyLink = async (): Promise<void> => {
    await navigator.clipboard.writeText(pinUrl(pinId));
    show({ title: tp("linkCopied"), description: title, img: imageUrl });
  };

  const onDownload = async (): Promise<void> => {
    try {
      await downloadPin({ url: imageUrl, title });
    } catch {
      show({ title: tp("downloadFailed"), description: tp("tryAgain") });
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
      show({ title: tp("reportReceived"), description: tp("reportThanks") });
    } catch {
      show({ title: tp("reportFailed"), description: tp("tryAgain") });
    }
  };

  const onConfirmDelete = (): void => {
    startDelete(async () => {
      const result = await deletePin(pinId);
      if (result.ok) {
        setConfirmDelete(false);
        show({ title: tp("pinDeleted") });
        router.replace("/");
      } else {
        setConfirmDelete(false);
        show({ title: tp("deleteFailed"), description: result.error });
      }
    });
  };

  const menuItems: MenuItem[] = [
    { label: tp("copyLink"), icon: <LinkIcon size={18} />, onSelect: () => void onCopyLink() },
    {
      label: tp("downloadImage"),
      icon: <DownloadIcon size={18} />,
      onSelect: () => void onDownload(),
    },
    ...(link !== null
      ? [
          {
            label: td("visitSite"),
            onSelect: () => window.open(link, "_blank", "noopener,noreferrer"),
          },
        ]
      : []),
    ...(isOwner
      ? [
          {
            label: tp("editPin"),
            icon: <ComposeIcon size={18} />,
            onSelect: () => setEditOpen(true),
          },
        ]
      : []),
    isOwner
      ? {
          label: tp("deletePin"),
          icon: <TrashIcon size={18} />,
          onSelect: () => setConfirmDelete(true),
          destructive: true,
        }
      : {
          label: tp("reportPin"),
          icon: <FlagIcon size={18} />,
          onSelect: () => withAuth(() => void onReport()),
          destructive: true,
        },
  ];

  return (
    <>
      <ConfirmDialog
        open={confirmDelete}
        title={tp("deleteTitle")}
        description={tp("deleteBody")}
        confirmLabel={tp("delete")}
        destructive
        pending={deleting}
        onConfirm={onConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      {isOwner ? (
        <EditPinDialog
          pinId={pinId}
          initialTitle={title}
          initialDescription={description ?? ""}
          initialLink={link ?? ""}
          initialTags={tags}
          initialPlace={place}
          initialApproximate={place?.approximate ?? false}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <LikeButton
            pinId={pinId}
            initialLiked={initialLiked}
            initialCount={likeCount}
            className="h-11 px-3"
            isAuthed={isAuthed}
          />
          {isAuthed ? <SharePinMenu pinId={pinId} /> : null}
          <Menu label={tp("moreOptions")} icon={<MoreIcon />} align="start" items={menuItems} />
        </div>
        {!isOwner && isAuthed && boards.length > 0 ? (
          <SaveToBoard pinId={pinId} title={title} imageUrl={imageUrl} boards={boards} />
        ) : !isAuthed ? (
          <Button onClick={() => withAuth(() => undefined)}>{tp("save")}</Button>
        ) : null}
      </div>
    </>
  );
}
