import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Visual tone of the icon button.
 *
 * - `ghost`: transparent, used in the nav and detail action rows.
 * - `solid`: white circle with a pop shadow, used on image overlays.
 * - `dark`: filled dark circle.
 */
export type IconButtonTone = "ghost" | "solid" | "dark";

/**
 * Diameter preset of the icon button.
 */
export type IconButtonSize = "sm" | "md" | "lg";

/**
 * Props for the {@link IconButton} component. An accessible `label` is required
 * because the button is icon-only.
 */
export type IconButtonProps = Omit<ComponentPropsWithRef<"button">, "aria-label"> & {
  label: string;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  active?: boolean;
  children: ReactNode;
};

const TONE_CLASSES: Record<IconButtonTone, string> = {
  ghost: "text-ink hover:bg-surface",
  solid: "bg-bg text-ink shadow-pop hover:bg-surface",
  dark: "bg-ink text-bg hover:bg-ink/90",
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: "size-9",
  md: "size-10",
  lg: "size-11",
};

const ACTIVE_CLASSES = "bg-ink text-bg hover:bg-ink/90";

/**
 * Circular, icon-only button used across the navigation, pin overlays and
 * detail actions. Requires an accessible `label`, resolves tone and size from
 * typed style maps and exposes an `active` state.
 *
 * @param props - Icon button configuration and native button attributes.
 * @returns The rendered icon button element.
 */
export function IconButton({
  label,
  tone = "ghost",
  size = "md",
  active = false,
  type = "button",
  className,
  children,
  ...rest
}: IconButtonProps): ReactElement {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "cursor-pointer transition-[background-color,color,transform] duration-150 ease-out",
        "active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        SIZE_CLASSES[size],
        active ? ACTIVE_CLASSES : TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
