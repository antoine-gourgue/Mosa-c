"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { IconButton } from "@/components/ui";
import { CloseIcon } from "@/icons";

/**
 * Overlay shell for the pin detail: a dark scrim with a centered card, closing
 * on Escape or a click outside the card. A fixed close button sits top-left.
 *
 * @param props - The detail content to display inside the card.
 * @param props.children - The pin detail content.
 * @returns The modal overlay element.
 */
export function DetailModal({ children }: { children: ReactNode }): ReactElement {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        router.back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

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

  return (
    <div
      onClick={() => router.back()}
      className="fixed inset-0 z-[60] overflow-y-auto bg-ink/55 p-6"
    >
      <IconButton
        ref={closeRef}
        label="Close"
        tone="solid"
        size="lg"
        className="fixed right-6 top-6 z-10"
        onClick={() => router.back()}
      >
        <CloseIcon />
      </IconButton>
      <div
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
