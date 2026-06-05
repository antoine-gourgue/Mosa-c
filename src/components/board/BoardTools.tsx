import type { ReactElement } from "react";
import { NotesIcon, OrganizeIcon, SparkleIcon } from "@/icons";
import type { IconProps } from "@/icons";

const TOOLS: { Icon: (props: IconProps) => ReactElement; label: string }[] = [
  { Icon: SparkleIcon, label: "More ideas" },
  { Icon: OrganizeIcon, label: "Organize" },
  { Icon: NotesIcon, label: "Notes" },
];

/**
 * Row of board tools (More ideas, Organize, Notes) shown under the board
 * header, each a labelled square button.
 *
 * @returns The board tools row element.
 */
export function BoardTools(): ReactElement {
  return (
    <div className="flex items-start justify-center gap-8">
      {TOOLS.map(({ Icon, label }) => (
        <button
          key={label}
          type="button"
          className="group flex cursor-pointer flex-col items-center gap-2"
        >
          <span className="grid size-[72px] place-items-center rounded-3xl bg-surface text-ink transition-colors duration-150 group-hover:bg-surface-2">
            <Icon size={26} />
          </span>
          <span className="text-sm text-ink">{label}</span>
        </button>
      ))}
    </div>
  );
}
