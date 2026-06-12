"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactElement } from "react";
import { PinFeed } from "@/components/pin";
import { Button, Spinner } from "@/components/ui";
import { MapPinIcon } from "@/icons";
import { loadNearbyPins } from "@/server/actions/feed";
import type { NearbyResult } from "@/server/actions/feed";

/**
 * Props for the {@link NearbyPins} component.
 */
export type NearbyPinsProps = {
  viewerId: string | null;
};

type Status = "idle" | "locating" | "ready" | "denied";

/**
 * Opt-in "near you" discovery section: a button requests the browser's location
 * and, on success, loads geotagged pins ranked by distance into a masonry feed.
 * Nothing is requested until the user asks, and a denied or unsupported
 * geolocation falls back to a gentle hint instead of an error.
 *
 * @param props - The viewer id, threaded to the feed for owner-only actions.
 * @returns The near-you section.
 */
export function NearbyPins({ viewerId }: NearbyPinsProps): ReactElement {
  const t = useTranslations("search");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<NearbyResult | null>(null);

  const locate = (): void => {
    if (typeof navigator === "undefined" || navigator.geolocation === undefined) {
      setStatus("denied");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void loadNearbyPins(position.coords.latitude, position.coords.longitude)
          .then((next) => {
            setResult(next);
            setStatus("ready");
          })
          .catch(() => setStatus("denied"));
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
          <MapPinIcon size={22} className="text-accent" />
          {t("nearby")}
        </h2>
        {status === "ready" ? (
          <Button variant="ghost" size="sm" onClick={locate}>
            {t("nearbyAgain")}
          </Button>
        ) : null}
      </div>

      {status === "idle" ? (
        <div className="mt-4">
          <Button variant="ghost" leftIcon={<MapPinIcon size={18} />} onClick={locate}>
            {t("nearbyCta")}
          </Button>
        </div>
      ) : null}

      {status === "locating" ? (
        <div className="mt-6 flex items-center gap-2 text-ink-soft">
          <Spinner size={18} />
        </div>
      ) : null}

      {status === "denied" ? (
        <p className="mt-4 text-sm text-ink-soft">{t("nearbyDenied")}</p>
      ) : null}

      {status === "ready" ? (
        result !== null && result.pins.length > 0 ? (
          <div className="mt-5">
            <PinFeed
              pins={result.pins}
              savedIds={result.savedIds}
              likedIds={result.likedIds}
              viewerId={viewerId}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-soft">{t("nearbyEmpty")}</p>
        )
      ) : null}
    </section>
  );
}
