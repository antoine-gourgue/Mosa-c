import type { SVGProps } from "react";

/**
 * Shared props for the line and solid UI glyphs. Icons inherit `currentColor`,
 * so color is controlled through the surrounding text color.
 */
export type IconProps = Omit<SVGProps<SVGSVGElement>, "width" | "height" | "strokeWidth"> & {
  size?: number;
  strokeWidth?: number;
  title?: string;
};

/**
 * Props for the Mosaic brand logo.
 */
export type LogoProps = Omit<SVGProps<SVGSVGElement>, "width" | "height"> & {
  size?: number;
  title?: string;
};
