"use client";

import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Avatar, IconButton } from "@/components/ui";
import { PlusIcon } from "@/icons";
import type { BoardMemberSummary } from "@/types/domain";

/**
 * Props for the {@link BoardCollaborators} component.
 */
export type BoardCollaboratorsProps = {
  members: BoardMemberSummary[];
  canManage?: boolean;
  onManage?: () => void;
};

/**
 * Overlapping stack of a board's member avatars, with an optional manage button
 * for the owner.
 *
 * @param props - The board members and the manage affordance.
 * @returns The collaborators stack element.
 */
export function BoardCollaborators({
  members,
  canManage = false,
  onManage,
}: BoardCollaboratorsProps): ReactElement {
  const t = useTranslations("board");
  return (
    <div className="flex items-center">
      {members.map((member, index) => (
        <span
          key={member.user.id}
          className="rounded-full ring-[3px] ring-bg"
          style={{ marginLeft: index === 0 ? 0 : -12 }}
          title={member.user.name}
        >
          <Avatar src={member.user.avatarUrl ?? undefined} name={member.user.name} size={40} />
        </span>
      ))}
      {canManage ? (
        <span className="ml-2">
          <IconButton
            label={t("manageCollaborators")}
            tone="ghost"
            className="bg-surface"
            onClick={onManage}
          >
            <PlusIcon size={20} />
          </IconButton>
        </span>
      ) : null}
    </div>
  );
}
