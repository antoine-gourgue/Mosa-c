"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { CheckIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui";
import { setAccountPrivacy } from "@/server/actions/account";

/**
 * Props for the {@link PrivacyToggle} component.
 */
export type PrivacyToggleProps = {
  initialPrivate: boolean;
};

/**
 * Toggle that makes the current user's account private or public. When private,
 * new followers must be approved; switching back to public auto-approves any
 * pending requests. Persists immediately and optimistically, reverting on
 * failure.
 *
 * @param props - The current privacy state to seed the toggle.
 * @returns The privacy toggle element.
 */
export function PrivacyToggle({ initialPrivate }: PrivacyToggleProps): ReactElement {
  const t = useTranslations("settings");
  const { show } = useToast();
  const [isPrivate, setIsPrivate] = useState(initialPrivate);
  const [, startTransition] = useTransition();

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
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isPrivate}
      className="flex w-full items-center justify-between gap-3 rounded-xl py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[15px] font-medium text-ink">{t("privateAccount")}</span>
        <span className="block text-sm text-ink-soft">{t("privateAccountHint")}</span>
      </span>
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
          isPrivate ? "border-ink bg-ink text-bg" : "border-line text-transparent",
        )}
      >
        <CheckIcon size={14} />
      </span>
    </button>
  );
}
