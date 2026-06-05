import type { ComponentPropsWithRef, ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * Corner radius preset of a surface.
 */
export type SurfaceRadius = "lg" | "pin" | "xl" | "2xl";

/**
 * Elevation (shadow) preset of a surface.
 */
export type SurfaceElevation = "none" | "pop";

/**
 * Props for the {@link Surface} component.
 */
export type SurfaceProps = ComponentPropsWithRef<"div"> & {
  radius?: SurfaceRadius;
  elevation?: SurfaceElevation;
};

const RADIUS_CLASSES: Record<SurfaceRadius, string> = {
  lg: "rounded-lg",
  pin: "rounded-pin",
  xl: "rounded-3xl",
  "2xl": "rounded-[32px]",
};

const ELEVATION_CLASSES: Record<SurfaceElevation, string> = {
  none: "",
  pop: "shadow-pop",
};

/**
 * Neutral card/surface primitive with tokenized radius and elevation, shared by
 * the detail and board screens.
 *
 * @param props - Surface configuration and native div attributes.
 * @returns The rendered surface element.
 */
export function Surface({
  radius = "lg",
  elevation = "none",
  className,
  children,
  ...rest
}: SurfaceProps): ReactElement {
  return (
    <div
      className={cn("bg-bg", RADIUS_CLASSES[radius], ELEVATION_CLASSES[elevation], className)}
      {...rest}
    >
      {children}
    </div>
  );
}
