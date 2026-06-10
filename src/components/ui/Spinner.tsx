"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link Spinner} component.
 */
export type SpinnerProps = {
  size?: number;
  label?: string;
  className?: string;
};

/**
 * Indeterminate loading spinner. Inherits `currentColor` and stops spinning
 * when the user requests reduced motion.
 *
 * @param props - Spinner configuration.
 * @returns The rendered spinner element.
 */
export function Spinner({ size = 24, label, className }: SpinnerProps): ReactElement {
  const t = useTranslations("ui");
  return (
    <svg
      role="status"
      aria-label={label ?? t("loading")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn("animate-spin motion-reduce:animate-none", className)}
    >
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
