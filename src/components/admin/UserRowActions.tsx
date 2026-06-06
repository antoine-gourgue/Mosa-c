"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { ConfirmDialog, Menu, useToast } from "@/components/ui";
import type { MenuItem } from "@/components/ui";
import { MoreIcon } from "@/icons";
import { deleteUser, setUserDisabled, setUserRole, setUserVerified } from "@/server/actions/admin";
import type { AdminUserRow } from "@/server/services";

/**
 * Props for the {@link UserRowActions} component.
 */
export type UserRowActionsProps = {
  user: AdminUserRow;
  isSelf: boolean;
};

type Pending = "ban" | "delete" | null;

/**
 * Row actions for a user in the admin table: an overflow menu to change role,
 * toggle the verified badge, ban/reinstate and delete, with confirmation for
 * the destructive actions. Actions targeting the signed-in admin are hidden.
 *
 * @param props - The user row and whether it is the current admin.
 * @returns The row actions element.
 */
export function UserRowActions({ user, isSelf }: UserRowActionsProps): ReactElement {
  const { show } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Pending>(null);

  const run = (action: () => Promise<void>, success: string): void => {
    startTransition(async () => {
      try {
        await action();
        setConfirm(null);
        show({ title: success });
        router.refresh();
      } catch (error) {
        setConfirm(null);
        show({
          title: "Action failed",
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    });
  };

  const items: MenuItem[] = [];
  if (!isSelf) {
    items.push({
      label: user.role === "ADMIN" ? "Remove admin" : "Make admin",
      onSelect: () =>
        run(
          () => setUserRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN"),
          user.role === "ADMIN" ? "Admin removed" : "Promoted to admin",
        ),
    });
  }
  items.push({
    label: user.verified ? "Remove verified" : "Verify",
    onSelect: () =>
      run(
        () => setUserVerified(user.id, !user.verified),
        user.verified ? "Verification removed" : "User verified",
      ),
  });
  if (!isSelf) {
    items.push({
      label: user.disabled ? "Reinstate" : "Ban",
      onSelect: () => {
        if (user.disabled) {
          run(() => setUserDisabled(user.id, false), "User reinstated");
        } else {
          setConfirm("ban");
        }
      },
    });
    items.push({
      label: "Delete",
      destructive: true,
      onSelect: () => setConfirm("delete"),
    });
  }

  return (
    <>
      <Menu
        label={`Actions for ${user.name}`}
        icon={<MoreIcon size={18} />}
        align="end"
        items={items}
      />
      <ConfirmDialog
        open={confirm === "ban"}
        title={`Ban ${user.name}?`}
        description="They will be signed out and unable to sign in until reinstated."
        confirmLabel="Ban"
        destructive
        pending={pending}
        onConfirm={() => run(() => setUserDisabled(user.id, true), "User banned")}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title={`Delete ${user.name}?`}
        description="This permanently removes the account and all of its content."
        confirmLabel="Delete"
        destructive
        pending={pending}
        onConfirm={() => run(() => deleteUser(user.id), "User deleted")}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
