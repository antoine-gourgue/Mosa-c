"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type { FormEvent, ReactElement } from "react";
import { Avatar, Button, IconButton, Input } from "@/components/ui";
import { TrashIcon } from "@/icons";
import { addBoardMember, removeBoardMember } from "@/server/actions/boards";
import type { BoardMemberSummary } from "@/types/domain";

/**
 * Props for the {@link ManageCollaborators} component.
 */
export type ManageCollaboratorsProps = {
  open: boolean;
  boardId: string;
  members: BoardMemberSummary[];
  onClose: () => void;
};

/**
 * Owner dialog to manage a board's collaborators: lists members with their
 * role, lets the owner remove non-owner members and add new ones by username
 * with an editor or viewer role.
 *
 * @param props - The board id, its members and the close handler.
 * @returns The dialog element, or null when closed.
 */
export function ManageCollaborators({
  open,
  boardId,
  members,
  onClose,
}: ManageCollaboratorsProps): ReactElement | null {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return null;
  }

  const onAdd = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const handle = username.trim();
    if (handle === "") {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await addBoardMember(boardId, handle, role);
        setUsername("");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not add the collaborator.");
      }
    });
  };

  const onRemove = (userId: string): void => {
    startTransition(async () => {
      try {
        await removeBoardMember(boardId, userId);
        router.refresh();
      } catch {
        setError("Could not remove the collaborator.");
      }
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-bg p-6 shadow-pop"
      >
        <h2 className="mb-4 text-xl font-extrabold text-ink">Collaborators</h2>

        <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {members.map((member) => (
            <li key={member.user.id} className="flex items-center gap-3">
              <Avatar src={member.user.avatarUrl ?? undefined} name={member.user.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-ink">{member.user.name}</p>
                <p className="text-[13px] capitalize text-ink-soft">{member.role.toLowerCase()}</p>
              </div>
              {member.role !== "OWNER" ? (
                <IconButton
                  label={`Remove ${member.user.name}`}
                  size="sm"
                  className="text-ink-soft hover:text-accent"
                  onClick={() => onRemove(member.user.id)}
                  disabled={pending}
                >
                  <TrashIcon size={18} />
                </IconButton>
              ) : null}
            </li>
          ))}
        </ul>

        <form onSubmit={onAdd} className="mt-5 flex flex-col gap-3">
          <Input
            label="Add by username"
            placeholder="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            error={error ?? undefined}
          />
          <div className="flex items-center gap-2">
            <select
              value={role}
              onChange={(event) => setRole(event.target.value === "VIEWER" ? "VIEWER" : "EDITOR")}
              aria-label="Role"
              className="h-11 rounded-2xl bg-surface px-4 text-[15px] text-ink outline-none focus:bg-surface-2"
            >
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <Button type="submit" disabled={pending || username.trim() === ""}>
              Add
            </Button>
            <Button type="button" variant="ghost" className="ml-auto" onClick={onClose}>
              Done
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
