"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement, ReactNode } from "react";
import { Toggle, useToast } from "@/components/ui";
import { setAccountPrivacy } from "@/server/actions/account";
import { SettingsSaveBar } from "./SettingsSaveBar";

/**
 * Props for the {@link PrivacySettings} component.
 */
export type PrivacySettingsProps = {
  initialPrivate: boolean;
  /** The blocked-users list, composed on the server. */
  blocked: ReactNode;
};

/**
 * Privacy tab body: the private-account switch (batched into a draft, persisted
 * only on Save via the sticky bar, reverting on Reset) above the blocked-users
 * list, with the Save/Reset bar pinned at the bottom of the section.
 *
 * @param props - The current privacy state and the blocked-users slot.
 * @returns The privacy settings element.
 */
export function PrivacySettings({ initialPrivate, blocked }: PrivacySettingsProps): ReactElement {
  const t = useTranslations("settings");
  const { show } = useToast();
  const [saved, setSaved] = useState(initialPrivate);
  const [draft, setDraft] = useState(initialPrivate);
  const [pending, startTransition] = useTransition();
  const dirty = draft !== saved;

  const onSave = (): void => {
    startTransition(async () => {
      const result = await setAccountPrivacy(draft);
      if (result.ok) {
        setSaved(draft);
        show({ title: t("privacySaved") });
      } else {
        setDraft(saved);
        show({ title: t("prefFailed"), description: result.error });
      }
    });
  };

  return (
    <>
      <h2 className="text-lg font-bold text-ink">{t("visibilityTitle")}</h2>
      <div className="mt-4 flex items-center justify-between gap-3 py-2">
        <span className="min-w-0">
          <span className="block text-[15px] font-medium text-ink">{t("privateAccount")}</span>
          <span className="block text-sm text-ink-soft">{t("privateAccountHint")}</span>
        </span>
        <Toggle
          checked={draft}
          onChange={() => setDraft(!draft)}
          disabled={pending}
          label={t("privateAccount")}
        />
      </div>

      <h2 className="mt-8 text-lg font-bold text-ink">{t("blockedTitle")}</h2>
      <div className="mt-4">{blocked}</div>

      <SettingsSaveBar
        dirty={dirty}
        pending={pending}
        onReset={() => setDraft(saved)}
        onSave={onSave}
      />
    </>
  );
}
