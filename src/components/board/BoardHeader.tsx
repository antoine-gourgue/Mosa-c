"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { MenuItem } from "@/components/ui";
import type { ReactElement } from "react";
import { Avatar, ConfirmDialog, Menu } from "@/components/ui";
import { LockIcon, MoreIcon } from "@/icons";
import { deleteBoard, leaveBoard, updateBoard } from "@/server/actions/boards";
import type { BoardDetail } from "@/types/domain";
import { BoardCollaborators } from "./BoardCollaborators";
import { BoardFollowButton } from "./BoardFollowButton";
import { BoardFormDialog, type BoardFormValues } from "./BoardFormDialog";
import { ManageCollaborators } from "./ManageCollaborators";

/**
 * Props for the {@link BoardHeader} component.
 */
export type BoardHeaderProps = {
  board: BoardDetail;
  initialFollowing: boolean;
  isAuthed: boolean;
};

/**
 * Board detail header: title, owner, collaborators and pin count, plus a
 * role-aware management menu (rename, manage collaborators, delete or leave)
 * with the matching dialogs. The default Quick Saves board has no management.
 *
 * @param props - The board detail.
 * @returns The board header element.
 */
export function BoardHeader({ board, initialFollowing, isAuthed }: BoardHeaderProps): ReactElement {
  const t = useTranslations("board");
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
  const canFollow = board.viewerRole === null && board.visibility === "PUBLIC" && !board.isDefault;
  const pinCount = board.pins.length;

  const onEdit = (values: BoardFormValues): void => {
    setError(null);
    startTransition(async () => {
      try {
        await updateBoard(board.id, {
          name: values.name,
          description: values.description,
          secret: values.secret,
        });
        setRenameOpen(false);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t("renameFailed"));
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
    menuItems.push({ label: t("editBoard"), onSelect: () => setRenameOpen(true) });
  }
  if (isOwner) {
    menuItems.push({ label: t("manageCollaborators"), onSelect: () => setManageOpen(true) });
    menuItems.push({
      label: t("deleteBoard"),
      onSelect: () => setDeleteOpen(true),
      destructive: true,
    });
  }
  if (canLeave) {
    menuItems.push({
      label: t("leaveBoard"),
      onSelect: () => setLeaveOpen(true),
      destructive: true,
    });
  }

  return (
    <header className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex items-center gap-2">
        {board.visibility === "SECRET" ? (
          <span className="text-ink-soft" title={t("secret")} aria-label={t("secret")}>
            <LockIcon size={26} />
          </span>
        ) : null}
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{board.name}</h1>
        {manageable ? (
          <Menu label={t("boardOptions")} icon={<MoreIcon />} align="end" items={menuItems} />
        ) : null}
      </div>

      {board.description !== null ? (
        <p className="max-w-md text-ink-soft">{board.description}</p>
      ) : null}

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

      <p className="text-sm text-ink-soft">{t("pinCount", { count: pinCount })}</p>

      {canFollow ? (
        <BoardFollowButton
          boardId={board.id}
          initialFollowing={initialFollowing}
          isAuthed={isAuthed}
        />
      ) : null}

      {renameOpen ? (
        <BoardFormDialog
          title={t("editBoard")}
          label={t("boardName")}
          submitLabel={t("save")}
          initialValue={board.name}
          initialDescription={board.description ?? ""}
          initialSecret={board.visibility === "SECRET"}
          pending={pending}
          error={error}
          onSubmit={onEdit}
          onCancel={() => setRenameOpen(false)}
        />
      ) : null}
      <ConfirmDialog
        open={deleteOpen}
        title={t("deleteTitle")}
        description={t("deleteBody")}
        confirmLabel={t("delete")}
        destructive
        pending={pending}
        onConfirm={onDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      <ConfirmDialog
        open={leaveOpen}
        title={t("leaveTitle")}
        description={t("leaveBody")}
        confirmLabel={t("leave")}
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
