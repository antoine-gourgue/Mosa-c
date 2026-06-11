"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the app is installable, its static assets are
 * cached and it can receive Web Push. Active in production, and in development
 * when Web Push is configured (so opt-in can be tested on localhost); otherwise
 * skipped in dev to avoid stale-cache surprises while iterating.
 *
 * @returns Null — this component has no visual output.
 */
export function RegisterServiceWorker(): null {
  useEffect(() => {
    const pushConfigured = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "") !== "";
    if (
      (process.env.NODE_ENV !== "production" && !pushConfigured) ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    const register = (): void => {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
