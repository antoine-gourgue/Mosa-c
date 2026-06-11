"use client";

import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link Toggle} component.
 */
export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Accessible name, when the switch has no associated visible label. */
  label?: string;
  id?: string;
};

/**
 * An accessible on/off switch (`role="switch"`): a pill track with a sliding
 * knob, accent when on. Operable by mouse and keyboard (Space/Enter, since it is
 * a native button). Controlled via `checked`/`onChange`.
 *
 * @param props - The checked state, change handler, disabled flag and label.
 * @returns The switch element.
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}: ToggleProps): ReactElement {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-accent" : "bg-surface-2",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-5 rounded-full bg-bg shadow-sm transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
