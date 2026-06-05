import type { ReactElement } from "react";
import { Skeleton } from "@/components/ui";

/**
 * Props for the {@link PinCardSkeleton} component.
 */
export type PinCardSkeletonProps = {
  height?: number;
};

/**
 * Loading placeholder matching the pin card layout (image plus title and
 * author meta), sized for the masonry feed.
 *
 * @param props - Skeleton configuration.
 * @returns The rendered pin card placeholder.
 */
export function PinCardSkeleton({ height = 240 }: PinCardSkeletonProps): ReactElement {
  return (
    <div className="mb-4 break-inside-avoid">
      <Skeleton height={height} className="rounded-pin" />
      <div className="mt-2 flex flex-col gap-2 px-1">
        <Skeleton height={12} width="70%" />
        <div className="flex items-center gap-2">
          <Skeleton circle width={22} height={22} />
          <Skeleton height={10} width="40%" />
        </div>
      </div>
    </div>
  );
}
