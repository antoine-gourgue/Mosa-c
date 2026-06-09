import type { ConversationSummary } from "@/types/domain";

/**
 * Resolves the display name of a conversation: the group title when set,
 * otherwise the other participants' names joined (a single name for a 1:1).
 *
 * @param summary - The conversation summary.
 * @returns The display name.
 */
export function conversationName(summary: ConversationSummary): string {
  if (summary.title !== null && summary.title.trim() !== "") {
    return summary.title;
  }
  if (summary.others.length === 0) {
    return summary.other.name;
  }
  return summary.others.map((other) => other.name).join(", ");
}
