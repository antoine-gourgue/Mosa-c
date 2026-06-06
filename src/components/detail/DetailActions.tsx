"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, IconButton, useToast } from "@/components/ui";
import { LikeButton } from "@/components/pin";
import { MoreIcon, ShareIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { pinUrl, sharePin } from "@/lib/share";
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
};

/**
 * Action row of the pin detail: More and Share on the left, Visit and a Save
 * toggle on the right. Saving updates optimistically, persists through the save
 * action and shows the "Saved to Quick Saves" toast.
 *
 * @param props - The pin identity, link and initial saved state.
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
}: DetailActionsProps): ReactElement {
  const [saved, setSaved] = useState(initialSaved);
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

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <IconButton label="More">
          <MoreIcon />
        </IconButton>
        <LikeButton
          pinId={pinId}
          initialLiked={initialLiked}
          initialCount={likeCount}
          className="h-11 px-3"
        />
      </div>
      <div className="flex items-center gap-2">
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
