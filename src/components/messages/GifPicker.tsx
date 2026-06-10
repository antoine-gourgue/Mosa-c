"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Input } from "@/components/ui";
import { SearchIcon } from "@/icons";
import { searchGifs } from "@/server/actions/messages";
import type { GifResult } from "@/server/actions/messages";

/**
 * Props for the {@link GifPicker} component.
 */
export type GifPickerProps = {
  onSelect: (url: string) => void;
};

/**
 * GIF search grid for the composer: a debounced search box over Giphy (trending
 * for a blank query). Picking a GIF hands its URL to `onSelect`, which sends it
 * as a message image. Shows a hint when the feature is unconfigured.
 *
 * @param props - The GIF-chosen handler.
 * @returns The GIF picker element.
 */
export function GifPicker({ onSelect }: GifPickerProps): ReactElement {
  const t = useTranslations("messages");
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void searchGifs(query).then((result) => {
        if (!cancelled) {
          setGifs(result.gifs);
          setLoading(false);
        }
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="w-80">
      <Input
        aria-label={t("searchGifs")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchGifs")}
        leadingIcon={<SearchIcon size={18} />}
      />
      <div className="mt-2 max-h-64 overflow-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-soft">{t("loading")}</p>
        ) : gifs.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-ink-soft">
            No GIFs found. Set <code>GIPHY_API_KEY</code> to enable GIF search.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => onSelect(gif.url)}
                className="overflow-hidden rounded-lg bg-surface-2 transition-opacity hover:opacity-90"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={gif.preview} alt="" loading="lazy" className="h-28 w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
