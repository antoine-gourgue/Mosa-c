"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import type { ReactElement } from "react";
import { CheckIcon } from "@/icons";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link Avatar} component.
 */
export type AvatarProps = {
  src?: string;
  name?: string;
  size?: number;
  verified?: boolean;
  badgeSize?: number;
  className?: string;
};

/**
 * Derives up to two uppercase initials from a display name.
 *
 * @param name - The full display name.
 * @returns The uppercased initials, empty when the name is blank.
 */
function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * User avatar with a numeric `size`, an optional verified badge and a graceful
 * initials fallback when the image is missing or fails to load.
 *
 * @param props - Avatar configuration.
 * @returns The rendered avatar element.
 */
export function Avatar({
  src,
  name = "",
  size = 40,
  verified = false,
  badgeSize,
  className,
}: AvatarProps): ReactElement {
  const t = useTranslations("ui");
  const [errored, setErrored] = useState(false);
  const showImage = src !== undefined && src !== "" && !errored;
  const badge = badgeSize ?? Math.round(size * 0.42);
  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <span className="relative size-full overflow-hidden rounded-full bg-surface-2">
        {showImage ? (
          <Image
            src={src}
            alt={name}
            width={size}
            height={size}
            className="size-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <span
            className="flex size-full items-center justify-center font-semibold text-ink-soft"
            style={{ fontSize: Math.round(size * 0.4) }}
          >
            {initialsOf(name)}
          </span>
        )}
      </span>
      {verified ? (
        <span
          aria-label={t("verified")}
          className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-accent text-bg ring-2 ring-bg"
          style={{ width: badge, height: badge }}
        >
          <CheckIcon size={Math.round(badge * 0.6)} strokeWidth={3} />
        </span>
      ) : null}
    </span>
  );
}
