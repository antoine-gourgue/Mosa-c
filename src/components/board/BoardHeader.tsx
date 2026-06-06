"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { MenuItem } from "@/components/ui";
import type { ReactElement } from "react";
import { Avatar, ConfirmDialog, Menu } from "@/components/ui";
import { MoreIcon } from "@/icons";
import { deleteBoard, leaveBoard, renameBoard } from "@/server/actions/boards";
import type { BoardDetail } from "@/types/domain";
import { BoardCollaborators } from "./BoardCollaborators";
import { BoardFormDialog } from "./BoardFormDialog";
import { ManageCollaborators } from "./ManageCollaborators";

/**
 * Props for the {@link BoardHeader} component.
 */
export type BoardHeaderProps = {
  board: BoardDetail;
};

/**
 * Board detail header: title, owner, collaborators and pin count, plus a
 * role-aware management menu (rename, manage collaborators, delete or leave)
 * with the matching dialogs. The default Quick Saves board has no management.
 *
 * @param props - The board detail.
 * @returns The board header element.
 */
export function BoardHeader({ board }: BoardHeaderProps): ReactElement {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isOwner = board.viewerRole === "OWNER";
  const canEdit = board.viewerRole === "OWNER" || board.viewerRole === "EDITOR";
  const canLeave = board.viewerRole !== null && !isOwner;
  const manageable = !board.isDefault && (canEdit || isOwner || canLeave);
  const pinCount = board.pins.length;

  const onRename = (name: string): void => {
    setError(null);
    startTransition(async () => {
      try {
        await renameBoard(board.id, name);
        setRenameOpen(false);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not rename the board.");
      }
    });
  };

  const onDelete = (): void => {
    startTransition(async () => {
      await deleteBoard(board.id);
      router.push("/boards");
    });
  };

  const onLeave = (): void => {
    startTransition(async () => {
      await leaveBoard(board.id);
      router.push("/boards");
    });
  };

  const menuItems: MenuItem[] = [];
  if (canEdit) {
    menuItems.push({ label: "Rename board", onSelect: () => setRenameOpen(true) });
  }
  if (isOwner) {
    menuItems.push({ label: "Manage collaborators", onSelect: () => setManageOpen(true) });
    menuItems.push({
      label: "Delete board",
      onSelect: () => setDeleteOpen(true),
      destructive: true,
    });
  }
  if (canLeave) {
    menuItems.push({ label: "Leave board", onSelect: () => setLeaveOpen(true), destructive: true });
  }

  return (
    <header className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex items-center gap-2">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{board.name}</h1>
        {manageable ? (
          <Menu label="Board options" icon={<MoreIcon />} align="end" items={menuItems} />
        ) : null}
      </div>

      <Link
        href={board.owner.username !== null ? `/u/${board.owner.username}` : "#"}
        className="flex items-center gap-2"
      >
        <Avatar src={board.owner.avatarUrl ?? undefined} name={board.owner.name} size={28} />
        <span className="text-sm text-ink-soft">{board.owner.name}</span>
      </Link>

      {!board.isDefault ? (
        <BoardCollaborators
          members={board.members}
          canManage={isOwner}
          onManage={() => setManageOpen(true)}
        />
      ) : null}

      <p className="text-sm text-ink-soft">
        {pinCount} {pinCount === 1 ? "Pin" : "Pins"}
      </p>

      {renameOpen ? (
        <BoardFormDialog
          title="Rename board"
          label="Board name"
          submitLabel="Save"
          initialValue={board.name}
          pending={pending}
          error={error}
          onSubmit={onRename}
          onCancel={() => setRenameOpen(false)}
        />
      ) : null}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete board?"
        description="The board and its pin references will be permanently removed. The pins themselves are kept."
        confirmLabel="Delete"
        destructive
        pending={pending}
        onConfirm={onDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      <ConfirmDialog
        open={leaveOpen}
        title="Leave board?"
        description="You will lose access to this board until you are added again."
        confirmLabel="Leave"
        destructive
        pending={pending}
        onConfirm={onLeave}
        onCancel={() => setLeaveOpen(false)}
      />
      <ManageCollaborators
        open={manageOpen}
        boardId={board.id}
        members={board.members}
        onClose={() => setManageOpen(false)}
      />
    </header>
  );
}
