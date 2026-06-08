"use client";

import { useId, useState } from "react";
import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link Input} component.
 */
export type InputProps = ComponentPropsWithRef<"input"> & {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  endAdornment?: ReactNode;
};

/**
 * Labeled text field used by the auth and create-pin forms. Associates the
 * label, input and helper/error text through a generated id and exposes an
 * accessible invalid state. Password fields gain a show/hide toggle. Supports
 * any native input type (email, password, number, text, ...).
 *
 * @param props - Input configuration and native input attributes.
 * @returns The rendered field element.
 */
export function Input({
  label,
  error,
  hint,
  id,
  type,
  className,
  leadingIcon,
  endAdornment,
  ...rest
}: InputProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const resolvedType = isPassword && revealed ? "text" : type;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">
            {leadingIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          type={resolvedType}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            "h-12 w-full rounded-xl bg-surface text-[15px] text-ink placeholder:text-ink-faint",
            "outline-none transition-[box-shadow,background-color] duration-150 ease-out",
            leadingIcon ? "pl-11" : "pl-4",
            isPassword ? "pr-16" : endAdornment ? "pr-12" : "pr-4",
            error ? "ring-2 ring-accent" : "focus:bg-surface-2 focus:ring-2 focus:ring-ink/15",
            className,
          )}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-pressed={revealed}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        ) : endAdornment ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{endAdornment}</span>
        ) : null}
      </div>
      {error ? (
        <p id={messageId} role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
