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
 * The official multi-colour Google "G" mark, for OAuth buttons. Rendered with
 * its brand colours (not `currentColor`), so it does not use {@link SvgIcon}.
 *
 * @param props - Icon sizing props.
 * @param props.size - The square size in pixels.
 * @returns The rendered Google logo.
 */
export function GoogleIcon({ size = 18 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
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
 * Chain-link glyph for copying a link.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function LinkIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l1.32-1.32" />
    </SvgIcon>
  );
}

/**
 * Map-pin glyph for a pin's place.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function MapPinIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </SvgIcon>
  );
}

/**
 * Circular-arrow glyph for refreshing.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function RefreshIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </SvgIcon>
  );
}

/**
 * At-sign glyph for mentions.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function AtIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </SvgIcon>
  );
}

/**
 * Gear glyph for settings.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function GearIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon strokeWidth={1.6} {...props}>
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.214 1.28c.062.375.312.687.644.87.074.04.147.083.22.127.325.196.72.257 1.076.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.004.827c-.292.24-.437.613-.43.992a6.932 6.932 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </SvgIcon>
  );
}

/**
 * Filled cog glyph for the active settings navigation state. The centre is cut
 * out as a hole via the even-odd fill rule.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function GearFilledIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon filled {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.214 1.28c.062.375.312.687.644.87.074.04.147.083.22.127.325.196.72.257 1.076.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.004.827c-.292.24-.437.613-.43.992a6.932 6.932 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      />
    </SvgIcon>
  );
}

/**
 * Smiley face glyph for emoji reactions.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function SmileIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <path d="M9 9.5h.01M15 9.5h.01" />
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

/**
 * House glyph used for the home navigation tab.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function HomeIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M3 9.8 12 3l9 6.8V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.8Z" />
      <path d="M9 21v-7h6v7" />
    </SvgIcon>
  );
}

/**
 * Downward chevron glyph used for dropdown affordances.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function ChevronDownIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </SvgIcon>
  );
}

/**
 * Pencil-on-square glyph used for the "new message" compose action.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function ComposeIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
    </SvgIcon>
  );
}

/**
 * Upward arrow glyph used inside the message composer's send button.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function SendIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M12 19V5m0 0-6 6m6-6 6 6" />
    </SvgIcon>
  );
}

/**
 * Picture glyph used for the "upload a photo" attachment option.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function ImageIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </SvgIcon>
  );
}

/**
 * Diagonal "expand" glyph used to open the pin detail as a full page.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function ExpandIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </SvgIcon>
  );
}

/**
 * Filled house glyph for the active home navigation state.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function HomeFilledIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon filled {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 9.8 12 3l9 6.8V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.8ZM9.5 21v-6h5v6z"
      />
    </SvgIcon>
  );
}

/**
 * Filled bell glyph for the active notifications navigation state.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function BellFilledIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon filled {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z" />
      <path d="M14 20a2 2 0 0 1-4 0Z" />
    </SvgIcon>
  );
}

/**
 * Filled comment-bubble glyph for the active messages navigation state.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function CommentFilledIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon filled {...props}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z" />
    </SvgIcon>
  );
}

/**
 * Person glyph used for profile menu entries.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function UserIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </SvgIcon>
  );
}

/**
 * Flag glyph used for the report action.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function FlagIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </SvgIcon>
  );
}

/**
 * Door-and-arrow glyph used for the log out action.
 *
 * @param props - Icon sizing and presentation props.
 * @returns The rendered SVG icon.
 */
export function LogoutIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </SvgIcon>
  );
}

/**
 * A closed padlock, used to mark secret/private boards.
 *
 * @param props - Icon size and style props.
 * @returns The lock glyph.
 */
export function LockIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon strokeWidth={1.6} {...props}>
      <path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75" />
      <path d="M6.75 10.5h10.5a1.5 1.5 0 0 1 1.5 1.5v6.75a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 1.5-1.5Z" />
    </SvgIcon>
  );
}

/**
 * A circle with a diagonal slash, used for blocking a user.
 *
 * @param props - Icon size and style props.
 * @returns The block glyph.
 */
export function BlockIcon(props: IconProps): ReactElement {
  return (
    <SvgIcon strokeWidth={1.8} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </SvgIcon>
  );
}
