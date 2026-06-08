"use client";

import { useId } from "react";
import type { ComponentPropsWithRef, ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link Textarea} component.
 */
export type TextareaProps = ComponentPropsWithRef<"textarea"> & {
  label?: string;
  error?: string;
  hint?: string;
};

/**
 * Labeled multi-line text field, mirroring {@link Input} for longer content
 * such as a pin description.
 *
 * @param props - Textarea configuration and native textarea attributes.
 * @returns The rendered field element.
 */
export function Textarea({
  label,
  error,
  hint,
  id,
  rows = 3,
  className,
  ...rest
}: TextareaProps): ReactElement {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
          {label}
        </label>
      ) : null}
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={cn(
          "w-full resize-none rounded-xl bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint",
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
