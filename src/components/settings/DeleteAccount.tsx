"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, ConfirmDialog, Input, useToast } from "@/components/ui";
import { deleteAccount } from "@/server/actions/account";

/**
 * Props for the {@link DeleteAccount} component.
 */
export type DeleteAccountProps = {
  username: string | null;
};

/**
 * Danger-zone control for permanently deleting the account. The user must type
 * their exact username (or "DELETE" when they have no handle) to enable the
 * button, then confirm in a dialog. On success the server signs out and
 * redirects, so no client navigation is needed.
 *
 * @param props - The current user's username, used as the confirmation phrase.
 * @returns The delete-account control.
 */
export function DeleteAccount({ username }: DeleteAccountProps): ReactElement {
  const t = useTranslations("settings");
  const { show } = useToast();
  const expected = username ?? "DELETE";
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const confirm = (): void => {
    startTransition(async () => {
      const result = await deleteAccount(value.trim());
      if (!result.ok) {
        setOpen(false);
        show({ title: t("deleteFailed"), description: result.error });
      }
    });
  };

  return (
    <div className="rounded-2xl border border-accent/40 p-5">
      <h2 className="text-lg font-bold text-ink">{t("dangerZone")}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t("deleteAccountHint")}</p>
      <div className="mt-4 max-w-xs">
        <Input
          label={t("deleteConfirmLabel", { confirm: expected })}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={expected}
          autoComplete="off"
        />
      </div>
      <Button
        variant="accent"
        className="mt-4"
        disabled={value.trim() !== expected}
        onClick={() => setOpen(true)}
      >
        {t("deleteAccount")}
      </Button>
      <ConfirmDialog
        open={open}
        title={t("deleteDialogTitle")}
        description={t("deleteDialogBody")}
        confirmLabel={t("deleteAccount")}
        destructive
        pending={pending}
        onConfirm={confirm}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}
