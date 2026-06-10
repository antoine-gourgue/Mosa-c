"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { SearchField } from "@/components/search/SearchField";
import { useMessagesUnread } from "@/components/messages";
import { Avatar, IconButton, Menu } from "@/components/ui";
import { CommentIcon, ComposeIcon, Logo, LogoutIcon, UserIcon } from "@/icons";
import { logout } from "@/server/actions/auth";

/**
 * Props for the {@link TopNav} component.
 */
export type TopNavProps = {
  user: { name: string; image: string | null; username: string | null };
  isAuthed: boolean;
};

/**
 * Sticky top bar: brand, the central search field and the account avatar menu.
 * On large screens the primary destinations live in the left {@link SideNav};
 * on mobile a messages shortcut sits next to the avatar.
 *
 * @param props - The current user and auth state.
 * @returns The top bar element.
 */
export function TopNav({ user, isAuthed }: TopNavProps): ReactElement {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount: unreadMessages } = useMessagesUnread();

  return (
    <nav className="sticky top-0 z-40 flex h-16 items-center gap-2 bg-bg px-3 sm:gap-3 sm:px-4">
      <Link href="/" className="flex shrink-0 items-center gap-2 sm:hidden">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-bg">
          <Logo size={20} />
        </span>
        <span className="text-[21px] font-bold text-accent">Mosaic</span>
      </Link>

      <div className="hidden flex-1 sm:flex">
        <SearchField className="w-full" />
      </div>

      <div className="flex flex-1 items-center justify-end gap-1 sm:flex-none">
        {isAuthed ? (
          <>
            <IconButton
              label={
                unreadMessages > 0 ? t("messagesUnread", { count: unreadMessages }) : t("messages")
              }
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
                label={t("accountMenu")}
                align="end"
                trigger={<Avatar name={user.name} src={user.image ?? undefined} size={44} />}
                items={[
                  ...(user.username !== null
                    ? [
                        {
                          label: t("yourProfile"),
                          icon: <UserIcon size={18} />,
                          onSelect: () => router.push(`/u/${user.username ?? ""}`),
                        },
                      ]
                    : []),
                  {
                    label: t("editProfile"),
                    icon: <ComposeIcon size={18} />,
                    onSelect: () => router.push("/settings/profile"),
                  },
                  {
                    label: t("logOut"),
                    icon: <LogoutIcon size={18} />,
                    onSelect: () => void logout(),
                    destructive: true,
                  },
                ]}
              />
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-xl bg-accent px-5 py-2.5 text-[15px] font-semibold text-bg transition-colors hover:bg-accent-press"
          >
            {t("logIn")}
          </Link>
        )}
      </div>
    </nav>
  );
}
