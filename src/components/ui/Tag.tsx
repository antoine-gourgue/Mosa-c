"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon } from "@/icons";

/**
 * Props for the {@link Tag} component. Providing `href` renders a navigation
 * link; providing `onRemove` renders a removable chip with a close button.
 */
export type TagProps = {
  children: ReactNode;
  href?: string;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
};

/**
 * Small chip for a pin tag, using the same `rounded-xl` radius as {@link Button}
 * (never a full pill). Renders a `Link` when `href` is set, or a chip with a
 * remove button when `onRemove` is set (e.g. the create form), otherwise a
 * static chip.
 *
 * @param props - The chip content and optional link / remove behaviour.
 * @returns The tag chip element.
 */
export function Tag({ children, href, onRemove, removeLabel, className }: TagProps): ReactElement {
  const t = useTranslations("ui");
  const classes = cn(
    "inline-flex items-center gap-1 rounded-xl bg-surface px-2.5 py-1 text-[13px] font-semibold text-ink-soft",
    href !== undefined && "transition-colors hover:bg-surface-2 hover:text-ink",
    className,
  );
  if (href !== undefined) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <span className={classes}>
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel ?? t("removeTag")}
          onClick={onRemove}
          className="grid size-4 place-items-center rounded text-ink-soft transition-colors hover:text-ink"
        >
          <CloseIcon size={12} />
        </button>
      ) : null}
    </span>
  );
}
