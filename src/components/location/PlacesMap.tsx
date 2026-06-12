"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { ReactElement } from "react";

/**
 * A geotagged pin reduced to what a places map needs.
 */
export type PlacesMapPin = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  imageUrl: string;
};

/**
 * Props for the {@link PlacesMap} component.
 */
export type PlacesMapProps = {
  pins: PlacesMapPin[];
};

/**
 * A full-bleed Leaflet map plotting geotagged pins as markers on OpenStreetMap
 * tiles, fitted to their bounds. Each marker opens a popup with the pin's
 * thumbnail and title linking to its detail. Leaflet is imported lazily inside
 * an effect so it never runs on the server; popup content is built as DOM nodes
 * (text via textContent) so a pin title can never inject markup.
 *
 * @param props - The geotagged pins to plot.
 * @returns The map element.
 */
export function PlacesMap({ pins }: PlacesMapProps): ReactElement {
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
      map = L.map(node, { scrollWheelZoom: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);
      const groups = new Map<string, PlacesMapPin[]>();
      for (const pin of pins) {
        const key = `${pin.lat},${pin.lng}`;
        const group = groups.get(key);
        if (group === undefined) {
          groups.set(key, [pin]);
        } else {
          group.push(pin);
        }
      }
      const points: [number, number][] = [];
      for (const group of groups.values()) {
        const first = group[0];
        if (first === undefined) {
          continue;
        }
        const icon =
          group.length > 1
            ? L.divIcon({
                className: "",
                html: `<span class="grid size-[22px] place-items-center rounded-full bg-accent text-[11px] font-bold text-bg shadow ring-2 ring-bg">${group.length}</span>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11],
              })
            : L.divIcon({
                className: "rounded-full bg-accent shadow ring-2 ring-bg",
                iconSize: [12, 12],
                iconAnchor: [6, 6],
              });
        const marker = L.marker([first.lat, first.lng], { icon }).addTo(map);
        const card = document.createElement("div");
        if (group.length === 1) {
          card.className = "w-44";
          const link = document.createElement("a");
          link.href = `/pin/${first.id}`;
          link.title = first.title;
          link.className = "group block cursor-pointer";
          const img = document.createElement("img");
          img.src = first.imageUrl;
          img.alt = first.title;
          img.loading = "lazy";
          img.className = "h-32 w-full rounded-xl object-cover transition group-hover:opacity-90";
          const title = document.createElement("span");
          title.textContent = first.title;
          title.className = "mt-1.5 block truncate px-0.5 text-[13px] font-semibold text-ink";
          link.append(img, title);
          card.append(link);
        } else {
          card.className = "grid w-48 grid-cols-2 gap-1.5";
          for (const pin of group) {
            const link = document.createElement("a");
            link.href = `/pin/${pin.id}`;
            link.title = pin.title;
            link.className = "block cursor-pointer";
            const img = document.createElement("img");
            img.src = pin.imageUrl;
            img.alt = pin.title;
            img.loading = "lazy";
            img.className = "h-20 w-full rounded-lg object-cover transition hover:opacity-85";
            link.append(img);
            card.append(link);
          }
        }
        marker.bindPopup(card, { closeButton: false, offset: [0, -6], minWidth: 0, maxWidth: 240 });
        points.push([first.lat, first.lng]);
      }
      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
      }
      setTimeout(() => map?.invalidateSize(), 0);
    });
    return () => {
      cancelled = true;
      if (map !== null) {
        map.remove();
      }
    };
  }, [pins]);

  return <div ref={containerRef} className="z-0 h-full w-full" />;
}
