"use client";

import "leaflet/dist/leaflet.css";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { Logo, MapPinIcon } from "@/icons";
import type { PinPlace as Place } from "@/types/domain";

/**
 * Props for the {@link PinPlace} component.
 */
export type PinPlaceProps = {
  place: Place;
};

/**
 * The location section of the pin detail: the place name and address, a small
 * non-scroll-hijacking Leaflet map (OpenStreetMap tiles) centred on the pin's
 * coordinates, and a link out to turn-by-turn directions. Leaflet is loaded
 * lazily inside an effect so it never runs on the server.
 *
 * @param props - The pin's place.
 * @returns The location section.
 */
export function PinPlace({ place }: PinPlaceProps): ReactElement {
  const t = useTranslations("detail");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (node === null) {
      return;
    }
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || containerRef.current === null) {
        return;
      }
      map = L.map(node, {
        attributionControl: true,
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([place.lat, place.lng], 14);
      map.attributionControl.setPrefix(false);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);
      const icon = L.divIcon({
        className: "rounded-full bg-accent shadow ring-2 ring-bg",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      L.marker([place.lat, place.lng], { icon, keyboard: false }).addTo(map);
      setTimeout(() => map?.invalidateSize(), 0);
    });
    return () => {
      cancelled = true;
      if (map !== null) {
        map.remove();
      }
    };
  }, [place.lat, place.lng]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-start gap-2">
        <MapPinIcon size={18} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-ink">{place.name}</p>
          {place.address !== null ? (
            <p className="line-clamp-2 text-[13px] leading-snug text-ink-soft">{place.address}</p>
          ) : null}
          {place.approximate ? (
            <p className="text-[12px] text-ink-faint">{t("approximateNote")}</p>
          ) : null}
        </div>
      </div>
      <div className="relative">
        <div
          ref={containerRef}
          role="img"
          aria-label={place.name}
          className="z-0 h-44 w-full overflow-hidden rounded-2xl border border-line bg-surface"
        />
        <div className="pointer-events-none absolute bottom-2 left-2 z-[500] text-ink/45">
          <Logo size={18} />
        </div>
      </div>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
      >
        <MapPinIcon size={15} />
        {t("directions")}
      </a>
    </section>
  );
}
