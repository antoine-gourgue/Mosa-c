"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, ConfirmDialog, useToast } from "@/components/ui";
import { adminDeleteComment, adminDeletePin } from "@/server/actions/admin";

/**
 * Props for the {@link AdminRemoveAction} component.
 */
export type AdminRemoveActionProps = {
  kind: "pin" | "comment";
  id: string;
  description: string;
  redirectAfter?: string;
};

/**
 * A destructive "Remove" control for admin moderation. Confirms before deleting
 * the pin or comment, then refreshes the table.
 *
 * @param props - The target kind, its id and a confirmation description.
 * @returns The remove action element.
 */
export function AdminRemoveAction({
  kind,
  id,
  description,
  redirectAfter,
}: AdminRemoveActionProps): ReactElement {
  const { show } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onConfirm = (): void => {
    startTransition(async () => {
      try {
        if (kind === "pin") {
          await adminDeletePin(id);
        } else {
          await adminDeleteComment(id);
        }
        setOpen(false);
        show({ title: kind === "pin" ? "Pin removed" : "Comment removed" });
        if (redirectAfter !== undefined) {
          router.push(redirectAfter);
        } else {
          router.refresh();
        }
      } catch (error) {
        setOpen(false);
        show({
          title: "Could not remove",
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    });
  };

  return (
    <>
      <Button
        variant="plain"
        size="sm"
        className="text-accent hover:bg-accent/10"
        onClick={() => setOpen(true)}
      >
        Remove
      </Button>
      <ConfirmDialog
        open={open}
        title={kind === "pin" ? "Remove this pin?" : "Remove this comment?"}
        description={description}
        confirmLabel="Remove"
        destructive
        pending={pending}
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
