"use client";

import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useNavPanel } from "./NavPanelProvider";

/**
 * Props for the {@link ContentShell} component.
 */
export type ContentShellProps = {
  offset: boolean;
  children: ReactNode;
};

/**
 * Wraps the top bar and routed page content, reserving room on the left for the
 * {@link SideNav} rail and animating an extra left inset when the messages
 * overlay panel is open so the page slides to the right instead of being
 * covered. Only applies on the `sm` breakpoint up, where the rail and panel
 * exist; on mobile the content fills the width.
 *
 * @param props - Whether the rail offset applies and the wrapped content.
 * @returns The offset content wrapper.
 */
export function ContentShell({ offset, children }: ContentShellProps): ReactElement {
  const { activePanel } = useNavPanel();
  return (
    <div
      className={cn(
        "transition-[padding] duration-200 ease-out",
        offset ? (activePanel !== null ? "sm:pl-[424px]" : "sm:pl-16") : undefined,
      )}
    >
      {children}
    </div>
  );
}
