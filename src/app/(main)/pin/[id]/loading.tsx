import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui";

/**
 * Skeleton shown while a pin detail loads: a placeholder for the image and the
 * info panel.
 *
 * @returns The pin detail skeleton.
 */
export default function PinLoading(): ReactElement {
  return (
    <div className="mx-auto max-w-[1016px]">
      <Skeleton circle width={48} height={48} className="mb-4" />
      <div className="overflow-hidden rounded-[32px] bg-bg shadow-pop">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <Skeleton height={480} />
          <div className="flex flex-col gap-4 px-5 py-6 md:px-9 md:py-8">
            <Skeleton height={44} />
            <Skeleton height={30} width="70%" />
            <Skeleton height={16} />
            <Skeleton height={16} width="80%" />
            <Skeleton height={48} className="mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
