"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useNavPanel } from "@/components/layout/NavPanelProvider";
import { Avatar } from "@/components/ui";
import {
  AtIcon,
  BellIcon,
  CloseIcon,
  CommentIcon,
  HeartFilledIcon,
  PlusIcon,
  SmileIcon,
} from "@/icons";
import { cn } from "@/lib/cn";
import { useTimeFormat } from "@/hooks/use-time-format";
import { loadNotifications, markAllRead } from "@/server/actions/notifications";
import type { AppNotification, Creator, NotificationKind } from "@/types/domain";
import { FollowRequests } from "./FollowRequests";
import { useNotificationsUnread } from "./NotificationsProvider";

/**
 * Resolves the destination link for a notification: the pin for likes and
 * comments, the actor's profile for follows.
 *
 * @param item - The notification.
 * @returns The href to navigate to when the item is clicked.
 */
function linkFor(item: AppNotification): string {
  if (item.pinId !== null) {
    return `/pin/${item.pinId}`;
  }
  if (item.actor.username !== null) {
    return `/u/${item.actor.username}`;
  }
  return "/notifications";
}

/**
 * Resolves the small type badge (icon and color) shown over a notification's
 * actor avatar.
 *
 * @param kind - The notification kind.
 * @returns The badge icon and background class.
 */
function typeBadge(kind: NotificationKind): { icon: ReactElement; className: string } {
  switch (kind) {
    case "LIKE":
      return { icon: <HeartFilledIcon size={10} />, className: "bg-accent" };
    case "COMMENT":
      return { icon: <CommentIcon size={10} />, className: "bg-ink" };
    case "REPLY":
      return { icon: <CommentIcon size={10} />, className: "bg-accent" };
    case "REACTION":
      return { icon: <SmileIcon size={10} />, className: "bg-accent" };
    case "MENTION":
      return { icon: <AtIcon size={10} />, className: "bg-ink" };
    case "FOLLOW":
      return { icon: <PlusIcon size={10} />, className: "bg-ink-soft" };
  }
}

/**
 * Pinterest-style notifications overlay: a narrow panel that slides in to the
 * right of the {@link SideNav} rail (desktop only), pushing the page content
 * over via {@link ContentShell}. It lazily loads the viewer's notifications the
 * first time it opens and clears the rail bell badge by marking them read. On
 * mobile the dedicated `/notifications` route is used instead, so this panel is
 * hidden below the `sm` breakpoint.
 *
 * @returns The overlay element.
 */
export function NotificationsPanel(): ReactElement {
  const t = useTranslations("notifications");
  const time = useTimeFormat();
  const { activePanel, close } = useNavPanel();
  const { revision, clear } = useNotificationsUnread();
  const open = activePanel === "notifications";
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [requests, setRequests] = useState<Creator[]>([]);
  const loadedRevision = useRef(-1);

  useEffect(() => {
    if (!open || (loaded && loadedRevision.current === revision)) {
      return;
    }
    clear();
    let cancelled = false;
    void loadNotifications().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setItems(result.notifications);
        setRequests(result.requests);
        if (result.notifications.some((notification) => !notification.read)) {
          void markAllRead().then(() => {
            if (!cancelled) {
              setItems((current) => current.map((item) => ({ ...item, read: true })));
            }
          });
        }
      }
      loadedRevision.current = revision;
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, loaded, revision, clear]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <aside
      aria-label={t("title")}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "fixed bottom-0 left-16 top-0 z-40 hidden w-[360px] flex-col border-r border-line bg-bg transition-transform duration-200 ease-out sm:flex",
        open ? "translate-x-0" : "pointer-events-none -translate-x-[calc(100%+0.5rem)]",
      )}
    >
      <header className="flex items-center justify-between px-4 pb-1 pt-3">
        <h2 className="text-xl font-bold text-ink">{t("title")}</h2>
        <button
          type="button"
          aria-label={t("close")}
          onClick={close}
          className="-mr-1 grid size-9 cursor-pointer place-items-center rounded-xl text-ink-soft hover:bg-surface hover:text-ink"
        >
          <CloseIcon size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {!loaded ? (
          <ul>
            {[0, 1, 2, 3, 4].map((index) => (
              <li key={index} className="flex items-center gap-3 px-2 py-3">
                <span className="size-12 shrink-0 animate-pulse rounded-full bg-surface" />
                <span className="flex-1 space-y-2">
                  <span className="block h-3.5 w-3/4 animate-pulse rounded bg-surface" />
                  <span className="block h-3 w-1/3 animate-pulse rounded bg-surface" />
                </span>
              </li>
            ))}
          </ul>
        ) : items.length === 0 && requests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-surface text-ink-soft">
              <BellIcon size={26} />
            </span>
            <p className="font-semibold text-ink">{t("empty")}</p>
            <p className="max-w-xs text-sm text-ink-soft">{t("emptyHint")}</p>
          </div>
        ) : (
          <>
            <div className="px-2">
              <FollowRequests requesters={requests} />
            </div>
            <ul className="flex flex-col">
              {items.map((item) => {
                const badge = typeBadge(item.kind);
                return (
                  <li key={item.id}>
                    <Link
                      href={linkFor(item)}
                      onClick={close}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface",
                        !item.read && "bg-accent/[0.06]",
                      )}
                    >
                      <span className="relative shrink-0">
                        <Avatar
                          name={item.actor.name}
                          src={item.actor.avatarUrl ?? undefined}
                          size={44}
                        />
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full text-bg ring-2 ring-bg",
                            badge.className,
                          )}
                          aria-hidden
                        >
                          {badge.icon}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] leading-snug text-ink">
                          {item.message}
                        </span>
                        <span className="block text-xs text-ink-soft">
                          {time.relative(item.createdAt)}
                        </span>
                      </span>
                      {item.pinImageUrl !== null ? (
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={item.pinImageUrl}
                            alt=""
                            fill
                            sizes="44px"
                            className="bg-surface-2 object-cover"
                          />
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
