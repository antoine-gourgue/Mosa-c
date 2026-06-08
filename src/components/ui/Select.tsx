"use client";

import { useId } from "react";
import type { ComponentPropsWithRef, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link Select} component.
 */
export type SelectProps = ComponentPropsWithRef<"select"> & {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

/**
 * Labeled native select styled to match {@link Input}. Associates the label,
 * control and helper/error text through a generated id and exposes an
 * accessible invalid state.
 *
 * @param props - Select configuration, options and native select attributes.
 * @returns The rendered select field.
 */
export function Select({
  label,
  error,
  hint,
  id,
  className,
  children,
  ...rest
}: SelectProps): ReactElement {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-sm font-semibold text-ink">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={messageId}
        className={cn(
          "h-12 w-full cursor-pointer rounded-xl bg-surface px-4 text-[15px] text-ink",
          "outline-none transition-[box-shadow,background-color] duration-150 ease-out",
          error ? "ring-2 ring-accent" : "focus:bg-surface-2 focus:ring-2 focus:ring-ink/15",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
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
