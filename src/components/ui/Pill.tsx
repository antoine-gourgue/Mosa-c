import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Height and padding preset of the pill.
 */
export type PillSize = "sm" | "md" | "lg";

/**
 * Props for the {@link Pill} component. Providing `href` renders a navigation
 * link; otherwise a button is rendered.
 */
export type PillProps = {
  active?: boolean;
  size?: PillSize;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

const SIZE_CLASSES: Record<PillSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-16 px-6 text-base",
};

/**
 * Pill-shaped toggle used for navigation tabs and onboarding choices. Renders a
 * `Link` when `href` is set and a `button` otherwise; the active state uses a
 * dark fill with light text.
 *
 * @param props - Pill configuration.
 * @returns The rendered pill element.
 */
export function Pill({
  active = false,
  size = "md",
  href,
  onClick,
  disabled = false,
  fullWidth = false,
  className,
  children,
}: PillProps): ReactElement {
  const classes = cn(
    "inline-flex items-center justify-center rounded-full font-semibold",
    "cursor-pointer transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98]",
    SIZE_CLASSES[size],
    active ? "bg-ink text-bg" : "text-ink hover:bg-surface",
    fullWidth && "w-full",
    disabled && "pointer-events-none opacity-50",
    className,
  );
  if (href !== undefined) {
    return (
      <Link href={href} aria-current={active ? "page" : undefined} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={classes}
    >
      {children}
    </button>
  );
}
