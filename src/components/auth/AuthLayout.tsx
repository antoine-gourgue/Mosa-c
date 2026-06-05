import type { ReactElement, ReactNode } from "react";
import { AuthMosaic } from "./AuthMosaic";

/**
 * Two-column shell for the auth screens: the visual mosaic on the left and a
 * centered, width-constrained content column on the right.
 *
 * @param props - Layout props.
 * @param props.children - The auth content (form or onboarding step).
 * @returns The auth layout element.
 */
export function AuthLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="flex min-h-dvh">
      <AuthMosaic />
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[480px]">{children}</div>
      </div>
    </div>
  );
}
