import type { ReactElement } from "react";
import { Avatar } from "@/components/ui";
import type { ConversationSummary } from "@/types/domain";

/**
 * Props for the {@link ConversationAvatar} component.
 */
export type ConversationAvatarProps = {
  summary: ConversationSummary;
  size?: number;
};

/**
 * Conversation avatar: a single avatar for a 1:1, or two overlapping member
 * avatars for a group.
 *
 * @param props - The conversation summary and pixel size.
 * @returns The avatar element.
 */
export function ConversationAvatar({ summary, size = 48 }: ConversationAvatarProps): ReactElement {
  if (!summary.isGroup) {
    return (
      <span aria-hidden className="inline-flex shrink-0">
        <Avatar
          src={summary.other.avatarUrl ?? undefined}
          name={summary.other.name}
          size={size}
          verified={summary.other.verified}
        />
      </span>
    );
  }
  const sub = Math.round(size * 0.6);
  const [first, second] = summary.others;
  return (
    <span
      aria-hidden
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="absolute left-0 top-0">
        <Avatar src={first?.avatarUrl ?? undefined} name={first?.name ?? "?"} size={sub} />
      </span>
      <span className="absolute bottom-0 right-0">
        <Avatar src={second?.avatarUrl ?? undefined} name={second?.name ?? "?"} size={sub} />
      </span>
    </span>
  );
}
