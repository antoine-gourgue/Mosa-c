"use client";

import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { loadHighlight } from "@/server/actions/highlights";
import type { StoryReelItem } from "@/types/domain";
import { StoryViewer } from "./StoryViewer";

/**
 * Props for the {@link HighlightViewer} component.
 */
export type HighlightViewerProps = {
  highlightId: string;
  viewerId: string;
  onClose: () => void;
};

/**
 * Loads a highlight's stories and plays them in the shared {@link StoryViewer}
 * (a one-author reel with no expiry). Renders nothing while loading or when the
 * highlight is empty.
 *
 * @param props - The highlight id, the viewer id and the close handler.
 * @returns The viewer, or null.
 */
export function HighlightViewer({
  highlightId,
  viewerId,
  onClose,
}: HighlightViewerProps): ReactElement | null {
  const [reel, setReel] = useState<StoryReelItem[] | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    let active = true;
    void loadHighlight(highlightId).then((detail) => {
      if (!active) {
        return;
      }
      setTitle(detail?.title ?? "");
      setReel(
        detail === null || detail.stories.length === 0
          ? []
          : [{ author: detail.owner, stories: detail.stories, hasUnseen: false }],
      );
    });
    return () => {
      active = false;
    };
  }, [highlightId]);

  if (reel === null || reel.length === 0) {
    return null;
  }
  return (
    <StoryViewer reel={reel} startIndex={0} viewerId={viewerId} onClose={onClose} title={title} />
  );
}
