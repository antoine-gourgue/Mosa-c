"use client";

import { useId } from "react";
import type { ComponentPropsWithRef, ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link Input} component.
 */
export type InputProps = ComponentPropsWithRef<"input"> & {
  label?: string;
  error?: string;
  hint?: string;
};

/**
 * Labeled text field used by the auth and create-pin forms. Associates the
 * label, input and helper/error text through a generated id and exposes an
 * accessible invalid state. Supports any native input type (email, password,
 * number, text, ...).
 *
 * @param props - Input configuration and native input attributes.
 * @returns The rendered field element.
 */
export function Input({ label, error, hint, id, className, ...rest }: InputProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={cn(
          "h-12 w-full rounded-2xl bg-surface px-4 text-[15px] text-ink placeholder:text-ink-faint",
          "outline-none transition-[box-shadow,background-color] duration-150 ease-out",
          error ? "ring-2 ring-accent" : "focus:bg-surface-2 focus:ring-2 focus:ring-ink/15",
          className,
        )}
        {...rest}
      />
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
