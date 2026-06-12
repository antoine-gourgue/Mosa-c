"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Spinner } from "@/components/ui";
import { CloseIcon, MapPinIcon } from "@/icons";
import { searchPlaces } from "@/server/actions/places";
import type { PlaceResult } from "@/server/services/places";
import type { PinPlace } from "@/types/domain";

/**
 * Shortest query that triggers a geocoder lookup, matching the service floor.
 */
const MIN_QUERY = 3;

/**
 * Props for the {@link PlacePicker} component.
 */
export type PlacePickerProps = {
  value: PinPlace | null;
  onChange: (place: PinPlace | null) => void;
};

/**
 * A location field for the create/edit pin form: type to search places (debounced
 * OpenStreetMap lookup), pick a suggestion to attach it, and remove it to clear.
 * When a place is selected it collapses to a compact chip; otherwise it shows a
 * search input with a dropdown of suggestions.
 *
 * @param props - The current place and a change handler.
 * @returns The place picker element.
 */
export function PlacePicker({ value, onChange }: PlacePickerProps): ReactElement {
  const t = useTranslations("create");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    let active = true;
    const id = setTimeout(() => {
      if (q.length < MIN_QUERY) {
        if (active) {
          setResults([]);
          setSearching(false);
        }
        return;
      }
      setSearching(true);
      void searchPlaces(q)
        .then((places) => {
          if (active) {
            setResults(places);
          }
        })
        .finally(() => {
          if (active) {
            setSearching(false);
          }
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [query]);

  const select = (place: PlaceResult): void => {
    onChange({ name: place.name, address: place.address, lat: place.lat, lng: place.lng });
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  if (value !== null) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-2.5">
        <MapPinIcon size={18} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] text-ink">{value.name}</span>
          {value.address !== null ? (
            <span className="block truncate text-[13px] text-ink-soft">{value.address}</span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={t("removePlace")}
          className="grid size-7 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="flex items-center gap-2.5 rounded-xl bg-surface px-4 py-2.5 transition-colors focus-within:bg-surface-2">
        <MapPinIcon size={18} className="shrink-0 text-ink-soft" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder={t("placePlaceholder")}
          aria-label={t("place")}
          className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint"
        />
        {searching ? <Spinner size={16} /> : null}
      </label>

      {open && query.trim().length >= MIN_QUERY ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-bg py-1 shadow-lg">
          {results.length === 0 && !searching ? (
            <p className="px-4 py-3 text-sm text-ink-soft">{t("placeNoResults")}</p>
          ) : (
            <ul>
              {results.map((place, index) => (
                <li key={`${index}:${place.lat},${place.lng}`}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(place)}
                    className="flex w-full items-start gap-2.5 px-4 py-2 text-left transition-colors hover:bg-surface"
                  >
                    <MapPinIcon size={16} className="mt-0.5 shrink-0 text-ink-soft" />
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] text-ink">{place.name}</span>
                      <span className="block truncate text-[12px] text-ink-soft">
                        {place.address}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
