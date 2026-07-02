"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactElement, ReactNode } from "react";
import { MOBILE_BREAKPOINT } from "@/hooks/useMediaQuery";
import { CloseIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { DURATION, REDUCED_MOTION, gsap, useGSAP } from "@/lib/gsap";
import { IconButton } from "./IconButton";

/**
 * Props for the {@link Sheet} component.
 */
export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Visible heading; also labels the dialog for assistive tech. */
  title?: string;
  /** Accessible label used when no visible {@link SheetProps.title} is set. */
  ariaLabel?: string;
  /** Max width preset of the desktop dialog. Defaults to `md`. */
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<SheetProps["size"]>, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
};

/**
 * Responsive overlay primitive: a full-width bottom sheet on mobile that slides
 * up from the bottom edge, and a centered dialog on desktop (from the `sm`
 * breakpoint up — the same boundary as the app navigation). Rendered in a
 * portal with a dimmed backdrop, it closes on Escape or backdrop click, moves
 * focus to the panel on open, reserves the device safe-area inset and honours
 * reduced motion. Use it everywhere an app-level overlay is needed instead of
 * hand-rolling backdrops per screen.
 *
 * @param props - Open state, close handler, heading and content.
 * @returns The sheet element, or null when closed.
 */
export function Sheet({
  open,
  onClose,
  title,
  ariaLabel,
  size = "md",
  children,
  className,
}: SheetProps): ReactElement | null {
  const t = useTranslations("ui");
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useGSAP(
    () => {
      if (!open || panelRef.current === null) {
        return;
      }
      /**
       * Pick the slide direction from the live viewport via matchMedia (bottom
       * sheet on mobile, dialog on desktop) rather than a React state value, so
       * the intro tween runs exactly once and never gets interrupted mid-fade by
       * a re-render — which would leave the panel stuck semi-transparent.
       */
      gsap
        .matchMedia()
        .add(
          { reduce: REDUCED_MOTION, mobile: `(max-width: ${MOBILE_BREAKPOINT - 0.02}px)` },
          (context) => {
            const conditions = context.conditions;
            if (conditions === undefined || conditions.reduce) {
              return;
            }
            gsap.from(panelRef.current, {
              opacity: 0,
              y: conditions.mobile ? 24 : 12,
              yPercent: conditions.mobile ? 100 : 0,
              scale: conditions.mobile ? 1 : 0.96,
              duration: DURATION.fast,
              ease: "power2.out",
            });
          },
        );
    },
    { dependencies: [open] },
  );

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title !== undefined ? titleId : undefined}
        aria-label={title === undefined ? ariaLabel : undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "flex max-h-[90dvh] w-full flex-col bg-bg shadow-pop outline-none",
          "rounded-t-3xl pb-[env(safe-area-inset-bottom)]",
          "sm:max-h-[85dvh] sm:rounded-3xl sm:pb-0",
          SIZE_CLASSES[size],
          className,
        )}
      >
        <span
          aria-hidden="true"
          className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-surface-3 sm:hidden"
        />
        {title !== undefined ? (
          <div className="flex items-center justify-between gap-2 px-5 pb-2 pt-3 sm:pt-5">
            <h2 id={titleId} className="text-lg font-extrabold text-ink">
              {title}
            </h2>
            <IconButton label={t("close")} onClick={onClose} className="-mr-2">
              <CloseIcon size={20} />
            </IconButton>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
