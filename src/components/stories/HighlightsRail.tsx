"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactElement } from "react";
import { ConfirmDialog } from "@/components/ui";
import { removeHighlight } from "@/server/actions/highlights";
import type { Highlight } from "@/types/domain";
import { AddStoryToHighlightSheet } from "./AddStoryToHighlightSheet";
import { HighlightActionsSheet } from "./HighlightActionsSheet";
import { HighlightViewer } from "./HighlightViewer";
import { ManageHighlightSheet } from "./ManageHighlightSheet";

/**
 * Props for the {@link HighlightsRail} component.
 */
export type HighlightsRailProps = {
  highlights: Highlight[];
  viewerId: string;
  canManage: boolean;
};

/** Press duration past which a press opens the owner actions instead of viewing. */
const LONG_PRESS_MS = 450;

/**
 * A horizontal row of profile story highlights as circular ringed covers.
 * Tapping one plays it in the {@link HighlightViewer}. The profile owner can
 * long-press (or right-click) a cover to edit, add a story or delete it via the
 * {@link HighlightActionsSheet}. Renders nothing when there are none.
 *
 * @param props - The highlights, the current viewer id and whether the viewer owns them.
 * @returns The highlights rail, or null.
 */
export function HighlightsRail({
  highlights,
  viewerId,
  canManage,
}: HighlightsRailProps): ReactElement | null {
  const t = useTranslations("stories");
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [actionsId, setActionsId] = useState<string | null>(null);
  const [manageId, setManageId] = useState<string | null>(null);
  const [addId, setAddId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  if (highlights.length === 0) {
    return null;
  }

  const clearTimer = (): void => {
    if (pressTimer.current !== null) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const onPointerDown = (id: string): void => {
    if (!canManage) {
      return;
    }
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      setActionsId(id);
    }, LONG_PRESS_MS);
  };

  const onClick = (id: string): void => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    setOpenId(id);
  };

  const onContextMenu = (event: ReactMouseEvent, id: string): void => {
    if (!canManage) {
      return;
    }
    event.preventDefault();
    longPressed.current = true;
    setActionsId(id);
  };

  const confirmDelete = (): void => {
    if (deleteId === null) {
      return;
    }
    setDeleting(true);
    void removeHighlight(deleteId).then(() => {
      setDeleting(false);
      setDeleteId(null);
      router.refresh();
    });
  };

  const actionsTitle = highlights.find((highlight) => highlight.id === actionsId)?.title ?? "";

  return (
    <div className="-mt-4 mb-3 flex justify-center">
      <div className="flex max-w-full gap-4 overflow-x-auto pb-1">
        {highlights.map((highlight) => (
          <button
            key={highlight.id}
            type="button"
            onClick={() => onClick(highlight.id)}
            onPointerDown={() => onPointerDown(highlight.id)}
            onPointerUp={clearTimer}
            onPointerLeave={clearTimer}
            onContextMenu={(event) => onContextMenu(event, highlight.id)}
            className="flex w-[76px] shrink-0 select-none flex-col items-center gap-1 transition-transform duration-150 active:scale-90"
          >
            <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-press p-[2px]">
              <span className="grid size-full place-items-center rounded-full bg-bg p-[2px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={highlight.coverUrl}
                  alt=""
                  className="size-full rounded-full object-cover"
                />
              </span>
            </span>
            <span className="w-full truncate text-center text-xs font-medium text-ink">
              {highlight.title}
            </span>
          </button>
        ))}
      </div>

      {openId !== null ? (
        <HighlightViewer highlightId={openId} viewerId={viewerId} onClose={() => setOpenId(null)} />
      ) : null}

      {actionsId !== null ? (
        <HighlightActionsSheet
          title={actionsTitle}
          onEdit={() => {
            setManageId(actionsId);
            setActionsId(null);
          }}
          onAddStory={() => {
            setAddId(actionsId);
            setActionsId(null);
          }}
          onDelete={() => {
            setDeleteId(actionsId);
            setActionsId(null);
          }}
          onClose={() => setActionsId(null)}
        />
      ) : null}

      {manageId !== null ? (
        <ManageHighlightSheet highlightId={manageId} onClose={() => setManageId(null)} />
      ) : null}

      {addId !== null ? (
        <AddStoryToHighlightSheet highlightId={addId} onClose={() => setAddId(null)} />
      ) : null}

      <ConfirmDialog
        open={deleteId !== null}
        title={t("deleteHighlight")}
        description={t("deleteHighlightConfirm")}
        confirmLabel={t("deleteHighlight")}
        destructive
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
