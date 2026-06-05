import type { ReactElement } from "react";
import { Avatar, IconButton } from "@/components/ui";
import { PlusIcon } from "@/icons";

/**
 * A board collaborator surfaced to the UI.
 */
export type Collaborator = {
  name: string;
  src: string | null;
};

/**
 * Props for the {@link BoardCollaborators} component.
 */
export type BoardCollaboratorsProps = {
  collaborators: Collaborator[];
};

/**
 * Overlapping stack of collaborator avatars with an add button.
 *
 * @param props - The collaborators to display.
 * @returns The collaborators stack element.
 */
export function BoardCollaborators({ collaborators }: BoardCollaboratorsProps): ReactElement {
  return (
    <div className="flex items-center">
      {collaborators.map((collaborator, index) => (
        <span
          key={`${collaborator.name}-${index}`}
          className="rounded-full ring-[3px] ring-bg"
          style={{ marginLeft: index === 0 ? 0 : -12 }}
        >
          <Avatar src={collaborator.src ?? undefined} name={collaborator.name} size={44} />
        </span>
      ))}
      <span className="ml-2">
        <IconButton label="Add collaborator" tone="ghost" className="bg-surface">
          <PlusIcon size={20} />
        </IconButton>
      </span>
    </div>
  );
}
