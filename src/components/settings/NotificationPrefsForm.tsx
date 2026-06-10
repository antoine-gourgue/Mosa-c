"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import type { NotificationType } from "@/generated/prisma/enums";
import { CheckIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui";
import { updateNotificationPref } from "@/server/actions/notification-prefs";
import type { NotificationPrefs } from "@/server/services/notification-prefs";

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
 * In-app notification preferences: a labelled square toggle per notification
 * kind. Each toggle persists immediately and optimistically, reverting on
 * failure. Disabled kinds are skipped at notification-emit time.
 *
 * @param props - The current preferences to seed the toggles.
 * @returns The notification preferences form element.
 */
export function NotificationPrefsForm({ initialPrefs }: NotificationPrefsFormProps): ReactElement {
  const t = useTranslations("settings");
  const { show } = useToast();
  const [prefs, setPrefs] = useState(initialPrefs);
  const [, startTransition] = useTransition();

  const toggle = (type: NotificationType): void => {
    const next = !prefs[type];
    setPrefs((current) => ({ ...current, [type]: next }));
    startTransition(async () => {
      const result = await updateNotificationPref(type, next);
      if (!result.ok) {
        setPrefs((current) => ({ ...current, [type]: !next }));
        show({ title: t("prefFailed"), description: result.error });
      }
    });
  };

  return (
    <ul className="flex flex-col gap-1">
      {ROWS.map((row) => {
        const enabled = prefs[row.type];
        return (
          <li key={row.type}>
            <button
              type="button"
              onClick={() => toggle(row.type)}
              aria-pressed={enabled}
              className="flex w-full items-center justify-between gap-3 rounded-xl py-2 text-left"
            >
              <span className="text-[15px] font-medium text-ink">{t(row.key)}</span>
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                  enabled ? "border-ink bg-ink text-bg" : "border-line text-transparent",
                )}
              >
                <CheckIcon size={14} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
