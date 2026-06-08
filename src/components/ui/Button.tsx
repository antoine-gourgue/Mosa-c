import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Visual style of the button.
 *
 * - `accent` / `dark` / `ghost` / `social`: filled presets.
 * - `plain`: no background or text colour preset, for compact text-only actions
 *   that supply their own colour and hover through `className` (e.g. table row
 *   actions). Still inherits the shared shape, sizing and press behaviour.
 */
export type ButtonVariant = "accent" | "ghost" | "dark" | "social" | "plain";

/**
 * Height and padding preset of the button.
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props for the {@link Button} component.
 */
export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  accent: "bg-accent text-bg hover:bg-accent-press",
  dark: "bg-ink text-bg hover:bg-ink/90",
  ghost: "bg-surface text-ink hover:bg-surface-2",
  social: "border border-surface-3 bg-bg text-ink hover:bg-surface",
  plain: "",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-4 text-sm",
  md: "h-11 gap-2 px-5 text-[15px]",
  lg: "h-[52px] gap-2 px-6 text-base",
};

/**
 * Inline loading spinner shown while the button performs an async action.
 *
 * @returns The animated spinner element.
 */
function Spinner(): ReactElement {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

/**
 * Reusable, accessible button configured entirely through props. Variants and
 * sizes are resolved from typed style maps; the button disables itself and
 * shows a spinner while `loading`, and keeps a stable layout on press by
 * scaling via transform only.
 *
 * @param props - Button configuration and native button attributes.
 * @returns The rendered button element.
 */
export function Button({
  variant = "accent",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  type = "button",
  disabled,
  className,
  children,
  ...rest
}: ButtonProps): ReactElement {
  const isDisabled = disabled === true || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-xl font-semibold",
        "cursor-pointer transition-[background-color,color,box-shadow,transform] duration-150 ease-out",
        "active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
