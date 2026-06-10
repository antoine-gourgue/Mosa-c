"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, ReactElement } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CheckIcon } from "@/icons";

/**
 * The values submitted by the board form.
 */
export type BoardFormValues = {
  name: string;
  description: string;
  secret: boolean;
};

/**
 * Props for the {@link BoardFormDialog} component.
 */
export type BoardFormDialogProps = {
  title: string;
  label: string;
  submitLabel: string;
  initialValue?: string;
  initialDescription?: string;
  initialSecret?: boolean;
  pending?: boolean;
  error?: string | null;
  onSubmit: (values: BoardFormValues) => void;
  onCancel: () => void;
};

/**
 * Dialog used to create or edit a board: name, optional description and a
 * "secret board" toggle. Rendered in a portal with a dimmed backdrop, it seeds
 * the fields from the initial values and closes on Escape or backdrop click. The
 * parent mounts it only while open, so the fields reset on each open.
 *
 * @param props - The dialog copy, initial values, state and submit/cancel handlers.
 * @returns The dialog element.
 */
export function BoardFormDialog({
  title,
  label,
  submitLabel,
  initialValue = "",
  initialDescription = "",
  initialSecret = false,
  pending = false,
  error,
  onSubmit,
  onCancel,
}: BoardFormDialogProps): ReactElement {
  const t = useTranslations("board");
  const [value, setValue] = useState(initialValue);
  const [description, setDescription] = useState(initialDescription);
  const [secret, setSecret] = useState(initialSecret);

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
    onSubmit({ name: value.trim(), description: description.trim(), secret });
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
            label={label}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            error={error ?? undefined}
            autoFocus
            maxLength={60}
          />
          <Textarea
            label={t("description")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={2}
            maxLength={300}
          />
          <button
            type="button"
            onClick={() => setSecret((current) => !current)}
            aria-pressed={secret}
            className="flex items-start gap-3 rounded-xl text-left"
          >
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                secret ? "border-ink bg-ink text-bg" : "border-line text-transparent",
              )}
            >
              <CheckIcon size={14} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">{t("secret")}</span>
              <span className="block text-[13px] text-ink-soft">{t("secretHint")}</span>
            </span>
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            {t("cancel")}
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
