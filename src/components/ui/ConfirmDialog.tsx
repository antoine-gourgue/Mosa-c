"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { DURATION, REDUCED_MOTION, gsap, useGSAP } from "@/lib/gsap";
import { Button } from "./Button";

/**
 * Props for the {@link ConfirmDialog} component.
 */
export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Accessible confirmation dialog rendered in a portal with a dimmed backdrop.
 * Closes on Escape or backdrop click, moves focus to the confirm button on open
 * and animates in (respecting reduced motion). Used for destructive actions
 * such as deleting a pin or a comment.
 *
 * @param props - The dialog copy, state and confirm/cancel handlers.
 * @returns The dialog element, or null when closed.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): ReactElement | null {
  const t = useTranslations("ui");
  const cardRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    confirmRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  useGSAP(
    () => {
      if (!open || cardRef.current === null) {
        return;
      }
      gsap.matchMedia().add(`not all and ${REDUCED_MOTION}`, () => {
        gsap.from(cardRef.current, {
          opacity: 0,
          y: 12,
          scale: 0.96,
          duration: DURATION.fast,
          ease: "power2.out",
        });
      });
    },
    { dependencies: [open] },
  );

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        ref={cardRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-bg p-6 shadow-pop"
      >
        <h2 id="confirm-title" className="text-xl font-extrabold text-ink">
          {title}
        </h2>
        {description !== undefined ? (
          <p className="mt-2 text-[15px] text-ink-soft">{description}</p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            {cancelLabel ?? t("cancel")}
          </Button>
          <Button
            ref={confirmRef}
            variant={destructive ? "accent" : "dark"}
            onClick={onConfirm}
            disabled={pending}
          >
            {confirmLabel ?? t("confirm")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
