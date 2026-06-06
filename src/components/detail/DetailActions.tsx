"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, IconButton, Menu, useToast } from "@/components/ui";
import { LikeButton } from "@/components/pin";
import { DownloadIcon, MoreIcon, ShareIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { downloadPin } from "@/lib/download";
import { pinUrl, sharePin } from "@/lib/share";
import { recordDownload } from "@/server/actions/downloads";
import { toggleSave } from "@/server/actions/saves";

/**
 * Props for the {@link DetailActions} component.
 */
export type DetailActionsProps = {
  pinId: string;
  title: string;
  imageUrl: string;
  link: string | null;
  initialSaved: boolean;
  initialLiked: boolean;
  likeCount: number;
  downloadCount: number;
};

/**
 * Action row of the pin detail: an overflow menu and Like on the left, Download,
 * Share, Visit and a Save toggle on the right. Saving updates optimistically and
 * shows the "Saved to Quick Saves" toast; downloading saves the image and
 * increments the pin's download count.
 *
 * @param props - The pin identity, link and initial engagement state.
 * @returns The actions row element.
 */
export function DetailActions({
  pinId,
  title,
  imageUrl,
  link,
  initialSaved,
  initialLiked,
  likeCount,
  downloadCount,
}: DetailActionsProps): ReactElement {
  const [saved, setSaved] = useState(initialSaved);
  const [downloads, setDownloads] = useState(downloadCount);
  const [, startTransition] = useTransition();
  const { show } = useToast();
  const router = useRouter();

  const onSave = (): void => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    if (!wasSaved) {
      show({
        title: "Saved to Quick Saves",
        description: title,
        img: imageUrl,
        action: { label: "View", onClick: () => router.push("/boards") },
      });
    }
    startTransition(async () => {
      try {
        const result = await toggleSave(pinId);
        setSaved(result.saved);
      } catch {
        setSaved(wasSaved);
      }
    });
  };

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

  const onReport = (): void => {
    show({ title: "Report received", description: "Thanks, we will review this Pin." });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Menu
          label="More options"
          icon={<MoreIcon />}
          align="start"
          items={[
            {
              label: "Copy link",
              icon: <ShareIcon size={18} />,
              onSelect: () => void onCopyLink(),
            },
            {
              label: "Download image",
              icon: <DownloadIcon size={18} />,
              onSelect: () => void onDownload(),
            },
            { label: "Report Pin", onSelect: onReport, destructive: true },
          ]}
        />
        <LikeButton
          pinId={pinId}
          initialLiked={initialLiked}
          initialCount={likeCount}
          className="h-11 px-3"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <IconButton label="Download image" onClick={() => void onDownload()}>
            <DownloadIcon size={22} />
          </IconButton>
          {downloads > 0 ? (
            <span
              className="text-[13px] font-medium text-ink-soft"
              aria-label={`${downloads} downloads`}
            >
              {downloads}
            </span>
          ) : null}
        </div>
        <IconButton label="Share" onClick={() => void onShare()}>
          <ShareIcon size={22} />
        </IconButton>
        {link !== null ? (
          <a href={link} target="_blank" rel="noreferrer noopener">
            <Button variant="ghost">Visit</Button>
          </a>
        ) : (
          <Button variant="ghost" disabled>
            Visit
          </Button>
        )}
        <button
          type="button"
          onClick={onSave}
          className={cn(
            "h-11 cursor-pointer rounded-full px-5 text-[15px] font-semibold text-bg transition-colors duration-150",
            saved ? "bg-ink hover:bg-ink/90" : "bg-accent hover:bg-accent-press",
          )}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
