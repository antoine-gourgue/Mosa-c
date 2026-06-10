import { describe, expect, it } from "vitest";
import type { ConversationSummary, Creator } from "@/types/domain";
import { conversationName } from "./conversation";

/**
 * Builds a minimal creator for the conversation-name tests.
 *
 * @param name - The display name.
 * @returns A creator with that name.
 */
function creator(name: string): Creator {
  return {
    id: name,
    name,
    username: null,
    bio: null,
    avatarUrl: null,
    followersLabel: null,
    verified: false,
    isPrivate: false,
  };
}

/**
 * Builds a conversation summary from a title and the other participants.
 *
 * @param title - The group title, or null.
 * @param others - The other participants.
 * @returns The conversation summary.
 */
function summary(title: string | null, others: Creator[]): ConversationSummary {
  return {
    id: "c1",
    other: others[0] ?? creator("Unknown"),
    others,
    title,
    isGroup: others.length > 1,
    lastMessage: null,
    unreadCount: 0,
    updatedAt: "",
  };
}

describe("conversationName", () => {
  it("uses the group title when set", () => {
    expect(conversationName(summary("Trip squad", [creator("Mira"), creator("Leo")]))).toBe(
      "Trip squad",
    );
  });

  it("ignores a blank/whitespace title and joins member names", () => {
    expect(conversationName(summary("   ", [creator("Mira"), creator("Leo")]))).toBe("Mira, Leo");
  });

  it("returns the single other's name for a 1:1", () => {
    expect(conversationName(summary(null, [creator("Mira")]))).toBe("Mira");
  });

  it("falls back to `other.name` when there are no other participants", () => {
    expect(conversationName(summary(null, []))).toBe("Unknown");
  });
});
