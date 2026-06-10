"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { ConfirmDialog, Menu, useToast } from "@/components/ui";
import type { MenuItem } from "@/components/ui";
import { BlockIcon, FlagIcon, MoreIcon } from "@/icons";
import { blockUser, unblockUser } from "@/server/actions/blocks";
import { reportUser } from "@/server/actions/reports";

/**
 * Props for the {@link ProfileActions} component.
 */
export type ProfileActionsProps = {
  userId: string;
  username: string | null;
  initialBlocked: boolean;
};

/**
 * Overflow menu shown on another user's profile: block or unblock the user, and
 * report the profile. Blocking is confirmed since it also removes any mutual
 * follow. Reflects the change by refreshing the route.
 *
 * @param props - The target user id, handle and current block state.
 * @returns The profile actions menu element.
 */
export function ProfileActions({
  userId,
  username,
  initialBlocked,
}: ProfileActionsProps): ReactElement {
  const t = useTranslations("profile");
  const { show } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmBlock, setConfirmBlock] = useState(false);
  const handle = username !== null ? `@${username}` : t("thisUser");

  const onUnblock = (): void => {
    startTransition(async () => {
      const result = await unblockUser(userId);
      if (result.ok) {
        show({ title: t("unblocked", { user: handle }) });
        router.refresh();
      } else {
        show({ title: t("actionFailed"), description: result.error });
      }
    });
  };

  const onBlock = (): void => {
    startTransition(async () => {
      const result = await blockUser(userId);
      setConfirmBlock(false);
      if (result.ok) {
        show({ title: t("blocked", { user: handle }) });
        router.refresh();
      } else {
        show({ title: t("actionFailed"), description: result.error });
      }
    });
  };

  const onReport = (): void => {
    startTransition(async () => {
      try {
        await reportUser(userId);
        show({ title: t("reportReceived"), description: t("reportThanks") });
      } catch {
        show({ title: t("actionFailed") });
      }
    });
  };

  const items: MenuItem[] = [
    initialBlocked
      ? { label: t("unblock"), icon: <BlockIcon size={18} />, onSelect: onUnblock }
      : {
          label: t("block"),
          icon: <BlockIcon size={18} />,
          onSelect: () => setConfirmBlock(true),
          destructive: true,
        },
    {
      label: t("reportProfile"),
      icon: <FlagIcon size={18} />,
      onSelect: onReport,
      destructive: true,
    },
  ];

  return (
    <>
      <Menu label={t("moreOptions")} icon={<MoreIcon size={20} />} align="end" items={items} />
      <ConfirmDialog
        open={confirmBlock}
        title={t("blockConfirmTitle", { user: handle })}
        description={t("blockConfirmBody")}
        confirmLabel={t("block")}
        destructive
        pending={pending}
        onConfirm={onBlock}
        onCancel={() => setConfirmBlock(false)}
      />
    </>
  );
}
