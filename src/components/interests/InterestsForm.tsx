"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, useToast } from "@/components/ui";
import { CheckIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { saveInterests } from "@/server/actions/interests";
import type { TagWithCount } from "@/types/domain";

/**
 * The minimum number of interests required to continue from onboarding (skipping
 * is always allowed). Editing from settings has no minimum.
 */
const MIN_ONBOARDING = 3;

/**
 * Props for the {@link InterestsForm} component.
 */
export type InterestsFormProps = {
  tags: TagWithCount[];
  initialSelected: string[];
  mode: "onboarding" | "settings";
};

/**
 * A grid of selectable interest tags backed by the interests action. In
 * onboarding mode it offers Skip and a Continue gated by a minimum selection,
 * and redirects home once saved; in settings mode it persists the edited
 * selection with a confirmation toast.
 *
 * @param props - The selectable tags, the initial selection and the mode.
 * @returns The interests form element.
 */
export function InterestsForm({ tags, initialSelected, mode }: InterestsFormProps): ReactElement {
  const t = useTranslations("interests");
  const router = useRouter();
  const { show } = useToast();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelected));
  const [pending, startTransition] = useTransition();

  const toggle = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const submit = (ids: string[]): void => {
    startTransition(async () => {
      const result = await saveInterests(ids);
      if (!result.ok) {
        show({ title: t("saveFailed") });
        return;
      }
      if (mode === "onboarding") {
        router.replace("/");
      } else {
        show({ title: t("saved") });
        router.refresh();
      }
    });
  };

  const count = selected.size;
  const canContinue = mode === "settings" || count >= MIN_ONBOARDING;

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-wrap gap-2.5">
        {tags.map((tag) => {
          const active = selected.has(tag.id);
          return (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => toggle(tag.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 rounded-2xl border px-4 py-2 text-[15px] font-semibold transition-colors",
                  active
                    ? "border-ink bg-ink text-bg"
                    : "border-line text-ink hover:border-ink/40 hover:bg-surface",
                )}
              >
                {active ? <CheckIcon size={15} /> : null}
                {tag.name}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-3">
        <Button
          variant="accent"
          disabled={!canContinue || pending}
          loading={pending}
          onClick={() => submit([...selected])}
        >
          {mode === "onboarding" ? t("continue") : t("save")}
        </Button>
        {mode === "onboarding" ? (
          <Button variant="ghost" disabled={pending} onClick={() => submit([])}>
            {t("skip")}
          </Button>
        ) : null}
        {mode === "onboarding" && count < MIN_ONBOARDING ? (
          <span className="text-sm text-ink-soft">
            {t("minHint", { count: MIN_ONBOARDING - count })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
