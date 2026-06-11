"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Button } from "@/components/ui";

/**
 * Props for the {@link SettingsSaveBar} component.
 */
export type SettingsSaveBarProps = {
  dirty: boolean;
  pending?: boolean;
  onReset: () => void;
  onSave: () => void;
};

/**
 * Sticky bar pinned to the bottom of a settings form with Reset and Save
 * actions. Both are disabled until the form has unsaved changes; Save shows a
 * pending state while persisting and Reset reverts to the last-saved values.
 *
 * @param props - The dirty/pending state and the reset/save handlers.
 * @returns The save bar element.
 */
export function SettingsSaveBar({
  dirty,
  pending = false,
  onReset,
  onSave,
}: SettingsSaveBarProps): ReactElement {
  const t = useTranslations("settings");
  return (
    <div className="sticky bottom-0 z-10 -mx-6 mt-8 border-t border-line bg-bg/85 px-6 py-3 backdrop-blur">
      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" disabled={!dirty || pending} onClick={onReset}>
          {t("reset")}
        </Button>
        <Button variant="accent" disabled={!dirty} loading={pending} onClick={onSave}>
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
