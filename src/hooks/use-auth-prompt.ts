"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Returns a guard that runs an action only when the viewer is authenticated,
 * otherwise sending them to the login page with the current path as the return
 * target. Used to gate write interactions on publicly readable pages.
 *
 * @param isAuthed - Whether the current viewer is signed in.
 * @returns A function that runs its callback when authed, or prompts sign-in.
 */
export function useAuthPrompt(isAuthed: boolean): (run: () => void) => void {
  const router = useRouter();
  const pathname = usePathname();
  return useCallback(
    (run: () => void): void => {
      if (!isAuthed) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      run();
    },
    [isAuthed, router, pathname],
  );
}
