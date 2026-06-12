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
      const icon = L.divIcon({
        className: "rounded-full bg-accent shadow ring-2 ring-bg",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const points: [number, number][] = [];
      for (const pin of pins) {
        const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
        const link = document.createElement("a");
        link.href = `/pin/${pin.id}`;
        link.className = "block w-40";
        const img = document.createElement("img");
        img.src = pin.imageUrl;
        img.alt = "";
        img.loading = "lazy";
        img.className = "h-24 w-full rounded-lg object-cover";
        const label = document.createElement("span");
        label.textContent = pin.title;
        label.className = "mt-1 block truncate text-[13px] font-semibold text-ink";
        link.append(img, label);
        marker.bindPopup(link);
        points.push([pin.lat, pin.lng]);
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
