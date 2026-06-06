"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, ReactElement } from "react";
import { Button, Input } from "@/components/ui";

/**
 * Props for the {@link CategoryFormDialog} component.
 */
export type CategoryFormDialogProps = {
  title: string;
  submitLabel: string;
  initialLabel?: string;
  initialImageUrl?: string;
  pending?: boolean;
  error?: string | null;
  onSubmit: (label: string, imageUrl: string) => void;
  onCancel: () => void;
};

/**
 * Dialog to create or edit a category, with a name and a cover image URL.
 * Rendered in a portal with a dimmed backdrop; closes on Escape or backdrop
 * click. The parent mounts it only while open, so fields reset on each open.
 *
 * @param props - The dialog copy, seed values, state and handlers.
 * @returns The dialog element.
 */
export function CategoryFormDialog({
  title,
  submitLabel,
  initialLabel = "",
  initialImageUrl = "",
  pending = false,
  error,
  onSubmit,
  onCancel,
}: CategoryFormDialogProps): ReactElement {
  const [label, setLabel] = useState(initialLabel);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);

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
    onSubmit(label.trim(), imageUrl.trim());
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
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            autoFocus
            maxLength={40}
          />
          <Input
            label="Cover image URL"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://…"
            error={error ?? undefined}
          />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending || label.trim() === "" || imageUrl.trim() === ""}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
