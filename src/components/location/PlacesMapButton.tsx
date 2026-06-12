"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { IconButton } from "@/components/ui";
import { CloseIcon, MapPinIcon } from "@/icons";
import { PlacesMap } from "./PlacesMap";
import type { PlacesMapPin } from "./PlacesMap";

/**
 * Props for the {@link PlacesMapButton} component.
 */
export type PlacesMapButtonProps = {
  pins: PlacesMapPin[];
  label: string;
  heading: string;
  closeLabel: string;
};

/**
 * An icon button that opens a full-screen modal plotting a set of geotagged
 * pins on a {@link PlacesMap}. Labels are passed in so the same control serves
 * boards and profiles. Closes on Escape or backdrop click. The caller only
 * renders it when there is at least one geotagged pin.
 *
 * @param props - The pins to plot and the localized labels.
 * @returns The button (and modal when open).
 */
export function PlacesMapButton({
  pins,
  label,
  heading,
  closeLabel,
}: PlacesMapButtonProps): ReactElement {
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
      <IconButton label={label} tone="ghost" onClick={() => setOpen(true)}>
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
                aria-label={heading}
                onClick={(event) => event.stopPropagation()}
                className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-bg shadow-pop"
              >
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <h2 className="text-lg font-bold text-ink">{heading}</h2>
                  <button
                    type="button"
                    aria-label={closeLabel}
                    onClick={() => setOpen(false)}
                    className="grid size-9 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-surface hover:text-ink"
                  >
                    <CloseIcon size={20} />
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <PlacesMap pins={pins} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
