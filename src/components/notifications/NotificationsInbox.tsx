"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Avatar, Button } from "@/components/ui";
import { BellIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { DURATION, REDUCED_MOTION, gsap, useGSAP } from "@/lib/gsap";
import { formatRelativeTime } from "@/lib/time";
import { markAllRead } from "@/server/actions/notifications";
import type { AppNotification } from "@/types/domain";

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
    <section className="mx-auto w-full max-w-2xl">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">Notifications</h1>
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
        <ul ref={listRef} className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} data-notification>
              <Link
                href={linkFor(item)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-surface",
                  !item.read && "bg-surface",
                )}
              >
                <Avatar name={item.actor.name} src={item.actor.avatarUrl ?? undefined} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-ink">{item.message}</p>
                  <p className="text-[13px] text-ink-faint">{formatRelativeTime(item.createdAt)}</p>
                </div>
                {item.pinImageUrl !== null ? (
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    <Image
                      src={item.pinImageUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>
                ) : null}
                {!item.read ? (
                  <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
