"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in production so the app is installable and its
 * static assets are cached. Renders nothing. Skipped in development to avoid
 * stale-cache surprises while iterating.
 *
 * @returns Null — this component has no visual output.
 */
export function RegisterServiceWorker(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
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
