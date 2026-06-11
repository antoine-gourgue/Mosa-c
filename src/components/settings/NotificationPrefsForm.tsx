"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import type { NotificationType } from "@/generated/prisma/enums";
import { Toggle, useToast } from "@/components/ui";
import { updateNotificationPrefs } from "@/server/actions/notification-prefs";
import type { NotificationPrefs } from "@/server/services/notification-prefs";
import { SettingsSaveBar } from "./SettingsSaveBar";

/**
 * Props for the {@link NotificationPrefsForm} component.
 */
export type NotificationPrefsFormProps = {
  initialPrefs: NotificationPrefs;
};

/**
 * The notification kinds shown as toggles, paired with their label key.
 */
const ROWS = [
  { type: "FOLLOW", key: "notifFollow" },
  { type: "LIKE", key: "notifLike" },
  { type: "COMMENT", key: "notifComment" },
  { type: "REPLY", key: "notifReply" },
  { type: "REACTION", key: "notifReaction" },
  { type: "MENTION", key: "notifMention" },
] as const satisfies readonly { type: NotificationType; key: string }[];

/**
 * In-app notification preferences: a labelled switch per kind. Changes are
 * batched into a draft and only persisted when the user clicks Save in the
 * sticky bar (Reset reverts to the last-saved values); disabled kinds are
 * skipped at notification-emit time.
 *
 * @param props - The current preferences to seed the toggles.
 * @returns The notification preferences form element.
 */
export function NotificationPrefsForm({ initialPrefs }: NotificationPrefsFormProps): ReactElement {
  const t = useTranslations("settings");
  const { show } = useToast();
  const [saved, setSaved] = useState(initialPrefs);
  const [draft, setDraft] = useState(initialPrefs);
  const [pending, startTransition] = useTransition();

  const dirty = ROWS.some((row) => draft[row.type] !== saved[row.type]);

  const toggle = (type: NotificationType): void => {
    setDraft((current) => ({ ...current, [type]: !current[type] }));
  };

  const onSave = (): void => {
    startTransition(async () => {
      const result = await updateNotificationPrefs(draft);
      if (result.ok) {
        setSaved(draft);
        show({ title: t("prefsSaved") });
      } else {
        show({ title: t("prefFailed"), description: result.error });
      }
    });
  };

  return (
    <>
      <ul className="flex flex-col gap-1">
        {ROWS.map((row) => (
          <li key={row.type} className="flex items-center justify-between gap-3 py-2">
            <span className="text-[15px] font-medium text-ink">{t(row.key)}</span>
            <Toggle
              checked={draft[row.type]}
              onChange={() => toggle(row.type)}
              disabled={pending}
              label={t(row.key)}
            />
          </li>
        ))}
      </ul>
      <SettingsSaveBar
        dirty={dirty}
        pending={pending}
        onReset={() => setDraft(saved)}
        onSave={onSave}
      />
    </>
  );
}
