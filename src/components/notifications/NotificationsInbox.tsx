"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Avatar, Button } from "@/components/ui";
import { BellIcon, CommentIcon, HeartFilledIcon, PlusIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { DURATION, REDUCED_MOTION, gsap, useGSAP } from "@/lib/gsap";
import { formatRelativeTime } from "@/lib/time";
import { markAllRead } from "@/server/actions/notifications";
import type { AppNotification, NotificationKind } from "@/types/domain";

/**
 * Props for the {@link NotificationsInbox} component.
 */
export type NotificationsInboxProps = {
  items: AppNotification[];
};

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
      return { icon: <HeartFilledIcon size={11} />, className: "bg-accent" };
    case "COMMENT":
      return { icon: <CommentIcon size={11} />, className: "bg-ink" };
    case "FOLLOW":
      return { icon: <PlusIcon size={11} />, className: "bg-ink-soft" };
  }
}

/**
 * The notifications inbox: a header with a mark-all-read control and a list of
 * notifications (actor avatar, message, time and an optional pin thumbnail).
 * On mount any unread notifications are marked read so the nav bell clears, and
 * an empty state is shown when there is nothing to display.
 *
 * @param props - The notifications to render.
 * @returns The inbox element.
 */
export function NotificationsInbox({ items }: NotificationsInboxProps): ReactElement {
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);
  const cleared = useRef(false);
  const [pending, setPending] = useState(false);
  const hasUnread = items.some((item) => !item.read);

  useEffect(() => {
    if (cleared.current || !hasUnread) {
      return;
    }
    cleared.current = true;
    void markAllRead().then(() => router.refresh());
  }, [hasUnread, router]);

  useGSAP(
    () => {
      if (listRef.current === null) {
        return;
      }
      const targets = listRef.current.querySelectorAll("[data-notification]");
      gsap
        .matchMedia()
        .add({ reduced: REDUCED_MOTION, base: `not all and ${REDUCED_MOTION}` }, (context) => {
          if (context.conditions?.reduced) {
            return;
          }
          gsap.from(targets, {
            opacity: 0,
            y: 8,
            duration: DURATION.base,
            ease: "power2.out",
            stagger: 0.04,
          });
        });
    },
    { scope: listRef, dependencies: [items.length] },
  );

  const onMarkAll = (): void => {
    setPending(true);
    void markAllRead()
      .then(() => router.refresh())
      .finally(() => setPending(false));
  };

  return (
    <section className="w-full">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-[28px] font-extrabold text-ink">Notifications</h1>
        {items.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={onMarkAll} disabled={pending || !hasUnread}>
            Mark all as read
          </Button>
        ) : null}
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-surface px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-soft">
            <BellIcon size={26} />
          </span>
          <p className="text-lg font-semibold text-ink">No notifications yet</p>
          <p className="max-w-sm text-sm text-ink-soft">
            When people follow you or react to your pins, you will see it here.
          </p>
        </div>
      ) : (
        <ul ref={listRef} className="flex flex-col gap-0.5">
          {items.map((item) => {
            const badge = typeBadge(item.kind);
            return (
              <li key={item.id} data-notification>
                <Link
                  href={linkFor(item)}
                  className={cn(
                    "flex items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-surface",
                    !item.read && "bg-accent/[0.06]",
                  )}
                >
                  <span className="relative shrink-0">
                    <Avatar
                      name={item.actor.name}
                      src={item.actor.avatarUrl ?? undefined}
                      size={48}
                    />
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 grid size-[22px] place-items-center rounded-full text-bg ring-2 ring-bg",
                        badge.className,
                      )}
                      aria-hidden
                    >
                      {badge.icon}
                    </span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] leading-snug text-ink">{item.message}</p>
                    <p className="text-[13px] text-ink-soft">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>

                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                    {item.pinImageUrl !== null ? (
                      <Image
                        src={item.pinImageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="rounded-xl bg-surface-2 object-cover"
                      />
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
