"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Avatar, Button, useToast } from "@/components/ui";
import { unblockUser } from "@/server/actions/blocks";
import type { Creator } from "@/types/domain";

/**
 * Props for the {@link BlockedUsersList} component.
 */
export type BlockedUsersListProps = {
  users: Creator[];
};

/**
 * The list of users the current user has blocked, each with an Unblock button.
 * Unblocking removes the row optimistically and reverts on failure.
 *
 * @param props - The blocked users to list.
 * @returns The blocked-users list element.
 */
export function BlockedUsersList({ users }: BlockedUsersListProps): ReactElement {
  const t = useTranslations("settings");
  const { show } = useToast();
  const [list, setList] = useState(users);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onUnblock = (user: Creator): void => {
    setPendingId(user.id);
    startTransition(async () => {
      const result = await unblockUser(user.id);
      setPendingId(null);
      if (result.ok) {
        setList((current) => current.filter((entry) => entry.id !== user.id));
        show({
          title: t("unblocked", { user: user.username !== null ? `@${user.username}` : user.name }),
        });
      } else {
        show({ title: t("actionFailed"), description: result.error });
      }
    });
  };

  if (list.length === 0) {
    return <p className="py-8 text-center text-ink-soft">{t("blockedEmpty")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {list.map((user) => (
        <li key={user.id} className="flex items-center gap-3">
          <Link
            href={user.username !== null ? `/u/${user.username}` : "#"}
            className="flex min-w-0 items-center gap-3"
          >
            <Avatar src={user.avatarUrl ?? undefined} name={user.name} size={40} />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-ink">{user.name}</span>
              {user.username !== null ? (
                <span className="block truncate text-sm text-ink-soft">@{user.username}</span>
              ) : null}
            </span>
          </Link>
          <Button
            variant="dark"
            size="sm"
            className="ml-auto"
            loading={pendingId === user.id}
            onClick={() => onUnblock(user)}
          >
            {t("unblock")}
          </Button>
        </li>
      ))}
    </ul>
  );
}
