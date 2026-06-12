"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { IconButton } from "@/components/ui";
import { CloseIcon, MapPinIcon } from "@/icons";
import { BoardMap } from "./BoardMap";
import type { BoardMapPin } from "./BoardMap";

/**
 * Props for the {@link BoardMapButton} component.
 */
export type BoardMapButtonProps = {
  pins: BoardMapPin[];
};

/**
 * A "Map" button that opens a full-screen modal plotting the board's geotagged
 * pins on a {@link BoardMap}. Closes on Escape or backdrop click. The caller only
 * renders it when the board has at least one geotagged pin.
 *
 * @param props - The board's geotagged pins.
 * @returns The button (and modal when open).
 */
export function BoardMapButton({ pins }: BoardMapButtonProps): ReactElement {
  const t = useTranslations("board");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <IconButton label={t("map")} tone="ghost" onClick={() => setOpen(true)}>
        <MapPinIcon size={18} />
      </IconButton>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex flex-col bg-ink/40 p-4 backdrop-blur-sm sm:p-8"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={t("placesHeading")}
                onClick={(event) => event.stopPropagation()}
                className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-bg shadow-pop"
              >
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <h2 className="text-lg font-bold text-ink">{t("placesHeading")}</h2>
                  <button
                    type="button"
                    aria-label={t("closeMap")}
                    onClick={() => setOpen(false)}
                    className="grid size-9 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface hover:text-ink"
                  >
                    <CloseIcon size={20} />
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <BoardMap pins={pins} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
