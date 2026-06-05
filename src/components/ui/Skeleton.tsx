import type { CSSProperties, ComponentPropsWithRef, ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link Skeleton} component.
 */
export type SkeletonProps = Omit<ComponentPropsWithRef<"div">, "style"> & {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  circle?: boolean;
  style?: CSSProperties;
};

/**
 * Shimmering placeholder used while content loads. The pulse is disabled when
 * the user requests reduced motion.
 *
 * @param props - Skeleton dimensions and native div attributes.
 * @returns The rendered placeholder element.
 */
export function Skeleton({
  width,
  height,
  radius,
  circle = false,
  className,
  style,
  ...rest
}: SkeletonProps): ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-surface-2 motion-reduce:animate-none",
        circle ? "rounded-full" : "rounded-xl",
        className,
      )}
      style={{ width, height, borderRadius: circle ? undefined : radius, ...style }}
      {...rest}
    />
  );
}
