import type { ReactElement, ReactNode } from "react";
import type { IconProps } from "./types";

type SvgIconProps = IconProps & {
  children: ReactNode;
  viewBox?: string;
  filled?: boolean;
};

/**
 * Internal SVG wrapper applying shared sizing, stroke and accessibility
 * defaults to every glyph.
 *
 * @param props - Glyph rendering props plus its vector children.
 * @returns The configured SVG element.
 */
function SvgIcon({
  size = 24,
  strokeWidth = 2,
  viewBox = "0 0 24 24",
  filled = false,
  title,
  children,
  ...rest
}: SvgIconProps): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={filled ? undefined : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/**
 * Magnifying-glass search glyph.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function SearchIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </SvgIcon>
  );
}

/**
 * Camera glyph used for visual search.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function CameraIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon viewBox="0 0 26 24" {...props}>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="13" cy="13" r="4" />
    </SvgIcon>
  );
}

/**
 * Plus glyph for create actions.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function PlusIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 5v14M5 12h14" />
    </SvgIcon>
  );
}

/**
 * Bell glyph for notifications.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function BellIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </SvgIcon>
  );
}

/**
 * Stacked-cards glyph for saves and collections.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function StackIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon filled {...props}>
      <path d="M7 4h9a2 2 0 0 1 2 2v9h-2V6H7zM4 9h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
    </SvgIcon>
  );
}

/**
 * Share glyph.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function ShareIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
    </SvgIcon>
  );
}

/**
 * Horizontal three-dot "more" glyph.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function MoreIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon filled {...props}>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </SvgIcon>
  );
}

/**
 * Chevron-left back/close glyph.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function BackIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M15 5l-7 7 7 7" />
    </SvgIcon>
  );
}

/**
 * Cross glyph used to close overlays and dismiss elements.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function CloseIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </SvgIcon>
  );
}

const HEART_PATH =
  "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z";

/**
 * Outline heart glyph for the unliked state.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function HeartIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d={HEART_PATH} />
    </SvgIcon>
  );
}

/**
 * Filled heart glyph for the liked state.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function HeartFilledIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon filled {...props}>
      <path d={HEART_PATH} />
    </SvgIcon>
  );
}

/**
 * Comment bubble glyph.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function CommentIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z" />
    </SvgIcon>
  );
}

/**
 * Download glyph.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function DownloadIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
    </SvgIcon>
  );
}

/**
 * Trash glyph for destructive delete actions.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function TrashIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </SvgIcon>
  );
}

/**
 * Checkmark glyph for verified and selected states.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function CheckIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="m5 13 4 4L19 7" />
    </SvgIcon>
  );
}

/**
 * Sliders glyph for filters.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function SlidersIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />
    </SvgIcon>
  );
}

/**
 * Sparkle glyph for "more ideas" and inspiration.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function SparkleIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon filled {...props}>
      <path d="M12 2c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7zM19 3c.2 1.4 1 2.1 2.4 2.4-1.4.2-2.2 1-2.4 2.4-.2-1.4-1-2.2-2.4-2.4C18 5.1 18.8 4.4 19 3z" />
    </SvgIcon>
  );
}

/**
 * Overlapping squares glyph for organizing boards.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function OrganizeIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon filled {...props}>
      <rect x="4" y="4" width="11" height="11" rx="2.5" />
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2.5"
        fill="#fff"
        stroke="currentColor"
        strokeWidth="2"
      />
    </SvgIcon>
  );
}

/**
 * Lines glyph for notes.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function NotesIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M4 6h16M4 11h16M4 16h10" />
    </SvgIcon>
  );
}
