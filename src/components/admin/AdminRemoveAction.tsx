"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { ConfirmDialog, useToast } from "@/components/ui";
import { adminDeleteComment, adminDeletePin } from "@/server/actions/admin";

/**
 * Props for the {@link AdminRemoveAction} component.
 */
export type AdminRemoveActionProps = {
  kind: "pin" | "comment";
  id: string;
  description: string;
};

/**
 * A destructive "Remove" control for admin moderation. Confirms before deleting
 * the pin or comment, then refreshes the table.
 *
 * @param props - The target kind, its id and a confirmation description.
 * @returns The remove action element.
 */
export function AdminRemoveAction({ kind, id, description }: AdminRemoveActionProps): ReactElement {
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
        router.refresh();
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
      >
        Remove
      </button>
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
