import { prisma } from "@/lib/prisma";
import type { ChatMessage, ConversationSummary } from "@/types/domain";
import { type CreatorRow, toCreator } from "./mappers";

const EPOCH = new Date(0);

/**
 * Builds the canonical pair key for a 1:1 conversation, independent of argument
 * order, used to dedupe the conversation for a pair of users.
 *
 * @param a - One user id.
 * @param b - The other user id.
 * @returns The sorted pair key.
 */
export function pairKeyFor(a: string, b: string): string {
  return [a, b].sort().join(":");
}

/**
 * Whether two users follow each other, the requirement to start a conversation.
 *
 * @param a - One user id.
 * @param b - The other user id.
 * @returns True when both follow each other.
 */
export async function areMutualFollowers(a: string, b: string): Promise<boolean> {
  const [aFollowsB, bFollowsA] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_creatorId: { followerId: a, creatorId: b } },
      select: { followerId: true },
    }),
    prisma.follow.findUnique({
      where: { followerId_creatorId: { followerId: b, creatorId: a } },
      select: { followerId: true },
    }),
  ]);
  return aFollowsB !== null && bFollowsA !== null;
}

/**
 * Whether a user is a participant of a conversation.
 *
 * @param conversationId - The conversation id.
 * @param userId - The user id.
 * @returns True when the user belongs to the conversation.
 */
export async function isParticipant(conversationId: string, userId: string): Promise<boolean> {
  const row = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { userId: true },
  });
  return row !== null;
}

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
};

/**
 * Maps a message row to the UI message type.
 *
 * @param row - The message row.
 * @returns The mapped message.
 */
export function toMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Returns the existing 1:1 conversation for a pair, creating it when absent.
 * Creating a new conversation requires the two users to follow each other; an
 * already-existing conversation is always returned.
 *
 * @param viewerId - The current user id.
 * @param otherUserId - The other participant's user id.
 * @returns The conversation id, or null when not allowed to start one.
 */
export async function getOrCreateConversation(
  viewerId: string,
  otherUserId: string,
): Promise<string | null> {
  if (viewerId === otherUserId) {
    return null;
  }
  const pairKey = pairKeyFor(viewerId, otherUserId);
  const existing = await prisma.conversation.findUnique({
    where: { pairKey },
    select: { id: true },
  });
  if (existing !== null) {
    return existing.id;
  }
  if (!(await areMutualFollowers(viewerId, otherUserId))) {
    return null;
  }
  const created = await prisma.conversation.create({
    data: {
      pairKey,
      participants: { create: [{ userId: viewerId }, { userId: otherUserId }] },
    },
    select: { id: true },
  });
  return created.id;
}

/**
 * Fetches a user's conversations, most recent activity first, each with the
 * other participant, the last message preview and the unread count.
 *
 * @param userId - The current user id.
 * @returns The user's conversation summaries.
 */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const rows = await prisma.conversationParticipant.findMany({
    where: { userId },
    orderBy: { conversation: { updatedAt: "desc" } },
    select: {
      lastReadAt: true,
      conversation: {
        select: {
          id: true,
          updatedAt: true,
          participants: {
            where: { userId: { not: userId } },
            select: { user: true },
            take: 1,
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, createdAt: true, senderId: true },
          },
        },
      },
    },
  });

  return Promise.all(
    rows.map(async (row) => {
      const conversation = row.conversation;
      const otherRow = conversation.participants[0]?.user as CreatorRow | undefined;
      const last = conversation.messages[0] ?? null;
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderId: { not: userId },
          createdAt: { gt: row.lastReadAt ?? EPOCH },
        },
      });
      return {
        id: conversation.id,
        other:
          otherRow !== undefined
            ? toCreator(otherRow)
            : {
                id: "",
                name: "Unknown",
                username: null,
                bio: null,
                avatarUrl: null,
                followersLabel: null,
                verified: false,
              },
        lastMessage:
          last === null
            ? null
            : { body: last.body, createdAt: last.createdAt.toISOString(), senderId: last.senderId },
        unreadCount,
        updatedAt: conversation.updatedAt.toISOString(),
      };
    }),
  );
}

/**
 * Fetches a conversation's messages oldest-first, after authorizing membership.
 *
 * @param conversationId - The conversation id.
 * @param viewerId - The current user id.
 * @param limit - The maximum number of messages to return.
 * @returns The conversation's messages, or null when the viewer is not a member.
 */
export async function getMessages(
  conversationId: string,
  viewerId: string,
  limit = 50,
): Promise<ChatMessage[] | null> {
  if (!(await isParticipant(conversationId, viewerId))) {
    return null;
  }
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.reverse().map(toMessage);
}
