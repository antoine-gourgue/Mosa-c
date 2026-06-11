"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Toggle, useToast } from "@/components/ui";
import { setAccountPrivacy } from "@/server/actions/account";

/**
 * Props for the {@link PrivacyToggle} component.
 */
export type PrivacyToggleProps = {
  initialPrivate: boolean;
};

/**
 * Switch that makes the current user's account private or public. Applied
 * immediately (its own action, with side effects like auto-approving pending
 * requests when going public), optimistic with revert on failure.
 *
 * @param props - The current privacy state to seed the switch.
 * @returns The privacy toggle element.
 */
export function PrivacyToggle({ initialPrivate }: PrivacyToggleProps): ReactElement {
  const t = useTranslations("settings");
  const { show } = useToast();
  const [isPrivate, setIsPrivate] = useState(initialPrivate);
  const [pending, startTransition] = useTransition();

  const toggle = (): void => {
    const next = !isPrivate;
    setIsPrivate(next);
    startTransition(async () => {
      const result = await setAccountPrivacy(next);
      if (!result.ok) {
        setIsPrivate(!next);
        show({ title: t("prefFailed"), description: result.error });
      }
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0">
        <span className="block text-[15px] font-medium text-ink">{t("privateAccount")}</span>
        <span className="block text-sm text-ink-soft">{t("privateAccountHint")}</span>
      </span>
      <Toggle
        checked={isPrivate}
        onChange={toggle}
        disabled={pending}
        label={t("privateAccount")}
      />
    </div>
  );
}
