"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { SearchField } from "@/components/search/SearchField";
import { useMessagesUnread } from "@/components/messages";
import { Avatar, IconButton, Menu } from "@/components/ui";
import { BellIcon, CommentIcon, Logo, PlusIcon, StackIcon } from "@/icons";
import { logout } from "@/server/actions/auth";

/**
 * Props for the {@link TopNav} component.
 */
export type TopNavProps = {
  user: { name: string; image: string | null; username: string | null };
  unreadCount: number;
  isAuthed: boolean;
};

/**
 * Sticky top navigation: brand, a central search field that routes to the
 * search page as the user types, the action icons (create, notifications,
 * saves) and an avatar account menu with profile links and log out.
 *
 * @param props - The current user and unread notification count.
 * @returns The top navigation element.
 */
export function TopNav({ user, unreadCount, isAuthed }: TopNavProps): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount: unreadMessages } = useMessagesUnread();

  return (
    <nav className="sticky top-0 z-50 flex h-20 items-center gap-2 bg-bg/90 px-4 backdrop-blur-md backdrop-saturate-150 sm:gap-3 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-bg">
          <Logo size={20} />
        </span>
        <span className="text-[21px] font-bold text-accent">Mosaic</span>
      </Link>

      <div className="hidden flex-1 justify-center sm:flex">
        <SearchField className="max-w-2xl" />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1 sm:flex-none">
        {isAuthed ? (
          <>
            <div className="hidden items-center gap-1 sm:flex">
              <IconButton label="Create" onClick={() => router.push("/create")}>
                <PlusIcon />
              </IconButton>
              <IconButton
                label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                active={pathname.startsWith("/notifications")}
                onClick={() => router.push("/notifications")}
                className="relative"
              >
                <BellIcon size={22} />
                {unreadCount > 0 ? (
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" />
                ) : null}
              </IconButton>
              <IconButton
                label={unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : "Messages"}
                active={pathname.startsWith("/messages")}
                onClick={() => router.push("/messages")}
                className="relative"
              >
                <CommentIcon size={22} />
                {unreadMessages > 0 ? (
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" />
                ) : null}
              </IconButton>
              <IconButton
                label="Saves"
                active={pathname.startsWith("/boards")}
                onClick={() => router.push("/boards")}
              >
                <StackIcon size={22} />
              </IconButton>
            </div>
            <IconButton
              label={unreadMessages > 0 ? `Messages, ${unreadMessages} unread` : "Messages"}
              active={pathname.startsWith("/messages")}
              onClick={() => router.push("/messages")}
              className="relative sm:hidden"
            >
              <CommentIcon size={22} />
              {unreadMessages > 0 ? (
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" />
              ) : null}
            </IconButton>
            <div className="ml-1 shrink-0">
              <Menu
                label="Account menu"
                align="end"
                trigger={<Avatar name={user.name} src={user.image ?? undefined} size={44} />}
                items={[
                  ...(user.username !== null
                    ? [
                        {
                          label: "Your profile",
                          onSelect: () => router.push(`/u/${user.username ?? ""}`),
                        },
                      ]
                    : []),
                  { label: "Edit profile", onSelect: () => router.push("/settings/profile") },
                  { label: "Log out", onSelect: () => void logout(), destructive: true },
                ]}
              />
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-accent px-5 py-2.5 text-[15px] font-semibold text-bg transition-colors hover:bg-accent-press"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
