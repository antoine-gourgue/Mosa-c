"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, ReactElement } from "react";
import { Button, Input } from "@/components/ui";

/**
 * Props for the {@link BoardFormDialog} component.
 */
export type BoardFormDialogProps = {
  title: string;
  label: string;
  submitLabel: string;
  initialValue?: string;
  pending?: boolean;
  error?: string | null;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

/**
 * Single-field dialog used to create or rename a board. Rendered in a portal
 * with a dimmed backdrop, it seeds the field with `initialValue` and closes on
 * Escape or backdrop click. The parent mounts it only while open, so the field
 * resets on each open.
 *
 * @param props - The dialog copy, state and submit/cancel handlers.
 * @returns The dialog element.
 */
export function BoardFormDialog({
  title,
  label,
  submitLabel,
  initialValue = "",
  pending = false,
  error,
  onSubmit,
  onCancel,
}: BoardFormDialogProps): ReactElement {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(value.trim());
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-bg p-6 shadow-pop"
      >
        <h2 className="mb-4 text-xl font-extrabold text-ink">{title}</h2>
        <Input
          label={label}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={error ?? undefined}
          autoFocus
          maxLength={60}
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || value.trim() === ""}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
