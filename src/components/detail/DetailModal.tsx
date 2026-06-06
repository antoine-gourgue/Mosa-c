"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { IconButton } from "@/components/ui";
import { CloseIcon } from "@/icons";
import { DURATION, REDUCED_MOTION, gsap, useGSAP } from "@/lib/gsap";

/**
 * Overlay shell for the pin detail: a dark scrim with a centered card that
 * scales and fades in on open and runs an exit transition before closing.
 * Closes on Escape or a click outside the card; a close button sits top-right.
 *
 * Because the modal lives in a parallel route slot that is not reset when
 * navigating forward to a non-intercepted route (e.g. a creator profile), it
 * unmounts itself as soon as the path leaves a pin route so it never lingers
 * over the destination page.
 *
 * @param props - The detail content to display inside the card.
 * @param props.children - The pin detail content.
 * @returns The modal overlay element, or null once the route is no longer a pin.
 */
export function DetailModal({ children }: { children: ReactNode }): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const scrimRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(scrimRef.current, { opacity: 0 }, { opacity: 1, duration: DURATION.base });
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, scale: 0.96, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: DURATION.base, ease: "power2.out" },
        );
      });
    },
    { scope: scrimRef },
  );

  const close = useCallback((): void => {
    if (closing.current) {
      return;
    }
    closing.current = true;
    const reduce = window.matchMedia(REDUCED_MOTION).matches;
    if (reduce) {
      router.back();
      return;
    }
    const exit = DURATION.base * 0.7;
    gsap.to(cardRef.current, { opacity: 0, scale: 0.96, y: 20, duration: exit, ease: "power2.in" });
    gsap.to(scrimRef.current, {
      opacity: 0,
      duration: exit,
      onComplete: () => router.back(),
    });
  }, [router]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);

  const stop = (event: MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
  };

  if (!pathname.startsWith("/pin/")) {
    return null;
  }

  return (
    <div
      ref={scrimRef}
      onClick={close}
      className="fixed inset-0 z-[60] overflow-y-auto bg-ink/55 p-6"
    >
      <IconButton
        ref={closeRef}
        label="Close"
        tone="solid"
        size="lg"
        className="fixed right-6 top-6 z-10"
        onClick={close}
      >
        <CloseIcon />
      </IconButton>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pin detail"
        onClick={stop}
        className="mx-auto my-4 max-w-[1016px] overflow-hidden rounded-[32px] bg-bg shadow-pop"
      >
        {children}
      </div>
    </div>
  );
}
