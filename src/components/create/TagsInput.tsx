"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import { Tag } from "@/components/ui";

/**
 * Props for the {@link TagsInput} component.
 */
export type TagsInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
};

/**
 * Inset-label chips input for a pin's tags: type a tag and press Enter or comma
 * to add it, Backspace on an empty field removes the last one, and each chip has
 * a remove button. Duplicates (case-insensitive) and blanks are ignored and the
 * count is capped.
 *
 * @param props - The current tags, the change handler and the maximum count.
 * @returns The tags input element.
 */
export function TagsInput({ value, onChange, max = 8 }: TagsInputProps): ReactElement {
  const t = useTranslations("create");
  const [draft, setDraft] = useState("");

  const add = (raw: string): void => {
    const name = raw.trim().slice(0, 30);
    if (name === "" || value.length >= max) {
      setDraft("");
      return;
    }
    if (value.some((tag) => tag.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, name]);
    setDraft("");
  };

  const remove = (tag: string): void => {
    onChange(value.filter((current) => current !== tag));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value[value.length - 1] as string);
    }
  };

  return (
    <label className="block cursor-text rounded-xl bg-surface px-4 pb-2.5 pt-2 transition-colors focus-within:bg-surface-2">
      <span className="block text-[13px] font-medium text-ink-soft">{t("tags")}</span>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {value.map((tag) => (
          <Tag
            key={tag}
            onRemove={() => remove(tag)}
            removeLabel={t("removeTag", { tag })}
            className="bg-bg"
          >
            #{tag}
          </Tag>
        ))}
        {value.length < max ? (
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => add(draft)}
            placeholder={value.length === 0 ? t("tagsPlaceholder") : ""}
            className="min-w-[10ch] flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
          />
        ) : null}
      </div>
    </label>
  );
}
