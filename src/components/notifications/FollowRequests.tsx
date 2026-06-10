"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Avatar, Button, useToast } from "@/components/ui";
import { acceptFollowRequest, declineFollowRequest } from "@/server/actions/follows";
import type { Creator } from "@/types/domain";

/**
 * Props for the {@link FollowRequests} component.
 */
export type FollowRequestsProps = {
  requesters: Creator[];
};

/**
 * The follow requests awaiting the current (private) user's approval, each with
 * Accept and Decline controls. Resolving a request removes its row
 * optimistically and reverts on failure. Renders nothing once the list is empty.
 *
 * @param props - The users who have requested to follow.
 * @returns The follow-requests panel, or null when there are none.
 */
export function FollowRequests({ requesters }: FollowRequestsProps): ReactElement | null {
  const t = useTranslations("notifications");
  const { show } = useToast();
  const [list, setList] = useState(requesters);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const resolve = (user: Creator, accept: boolean): void => {
    setPendingId(user.id);
    startTransition(async () => {
      try {
        await (accept ? acceptFollowRequest(user.id) : declineFollowRequest(user.id));
        setList((current) => current.filter((entry) => entry.id !== user.id));
      } catch {
        show({ title: t("requestFailed") });
      } finally {
        setPendingId(null);
      }
    });
  };

  if (list.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-bold text-ink">{t("requestsTitle")}</h2>
      <ul className="flex flex-col gap-2">
        {list.map((user) => (
          <li key={user.id} className="flex items-center gap-3">
            <Link
              href={user.username !== null ? `/u/${user.username}` : "#"}
              className="flex min-w-0 items-center gap-3"
            >
              <Avatar
                src={user.avatarUrl ?? undefined}
                name={user.name}
                size={44}
                verified={user.verified}
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink">{user.name}</span>
                {user.username !== null ? (
                  <span className="block truncate text-sm text-ink-soft">@{user.username}</span>
                ) : null}
              </span>
            </Link>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button
                variant="accent"
                size="sm"
                loading={pendingId === user.id}
                onClick={() => resolve(user, true)}
              >
                {t("requestAccept")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pendingId === user.id}
                onClick={() => resolve(user, false)}
              >
                {t("requestDecline")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
