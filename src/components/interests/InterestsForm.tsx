"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, Input, Tag as TagChip, useToast } from "@/components/ui";
import { PlusIcon, SearchIcon } from "@/icons";
import { saveInterests, searchInterestTags } from "@/server/actions/interests";
import type { Tag, TagWithCount } from "@/types/domain";

/**
 * The minimum number of interests required to continue from onboarding (skipping
 * is always allowed). Editing from settings has no minimum.
 */
const MIN_ONBOARDING = 3;

/**
 * Props for the {@link InterestsForm} component.
 */
export type InterestsFormProps = {
  popularTags: TagWithCount[];
  selectedTags: Tag[];
  mode: "onboarding" | "settings";
};

/**
 * Interest picker: the chosen tags as removable chips, a search to find topics
 * beyond the popular shortlist (so it scales to many tags), and a bounded,
 * scrollable grid of suggestions to add. Onboarding offers Skip and a Continue
 * gated by a minimum; settings persists with a confirmation toast.
 *
 * @param props - The popular tags, the current selection and the mode.
 * @returns The interests form element.
 */
export function InterestsForm({
  popularTags,
  selectedTags,
  mode,
}: InterestsFormProps): ReactElement {
  const t = useTranslations("interests");
  const router = useRouter();
  const { show } = useToast();
  const [selected, setSelected] = useState<Tag[]>(selectedTags);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tag[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectedIds = useMemo(() => new Set(selected.map((tag) => tag.id)), [selected]);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed === "") {
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      void searchInterestTags(trimmed)
        .then((found) => {
          if (!cancelled) {
            setResults(found);
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  const suggestions = (trimmed === "" ? popularTags : results).filter(
    (tag) => !selectedIds.has(tag.id),
  );

  const add = (tag: Tag): void => {
    setSelected((current) => (selectedIds.has(tag.id) ? current : [...current, tag]));
  };
  const remove = (id: string): void => {
    setSelected((current) => current.filter((tag) => tag.id !== id));
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

  const count = selected.length;
  const canContinue = mode === "settings" || count >= MIN_ONBOARDING;

  return (
    <div className="flex flex-col gap-5">
      <Input
        aria-label={t("searchPlaceholder")}
        placeholder={t("searchPlaceholder")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        leadingIcon={<SearchIcon size={18} />}
      />

      <div>
        <p className="mb-2 text-[13px] font-semibold text-ink-soft">{t("yourInterests")}</p>
        {selected.length === 0 ? (
          <p className="text-sm text-ink-faint">{t("noneSelected")}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {selected.map((tag) => (
              <li key={tag.id}>
                <TagChip
                  onRemove={() => remove(tag.id)}
                  removeLabel={t("remove", { tag: tag.name })}
                >
                  {tag.name}
                </TagChip>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-ink-soft">
          {trimmed === "" ? t("popular") : t("results")}
        </p>
        <div className="max-h-72 overflow-y-auto">
          {suggestions.length === 0 ? (
            <p className="py-2 text-sm text-ink-faint">
              {searching
                ? t("searching")
                : trimmed === ""
                  ? t("noPopular")
                  : t("noResults", { query })}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((tag) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    onClick={() => add(tag)}
                    data-testid="interest-suggestion"
                    className="flex items-center gap-1 rounded-2xl border border-line px-3.5 py-1.5 text-[15px] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-surface"
                  >
                    <PlusIcon size={14} />
                    {tag.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button
          variant="accent"
          disabled={!canContinue || pending}
          loading={pending}
          onClick={() => submit(selected.map((tag) => tag.id))}
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
