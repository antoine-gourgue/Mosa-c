import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ChatMessage, ConversationSummary, Creator } from "@/types/domain";
import { getHiddenUserIds } from "./blocks";
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
  pin: { id: string; imageUrl: string; title: string } | null;
  imageUrl: string | null;
  system: boolean;
};

/**
 * Prisma select for a shared pin attached to a message.
 */
export const MESSAGE_PIN_SELECT = { select: { id: true, imageUrl: true, title: true } } as const;

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
    pin: row.pin,
    imageUrl: row.imageUrl,
    system: row.system,
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
  const hidden = await getHiddenUserIds(viewerId);
  if (hidden.includes(otherUserId)) {
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
  const recipientFollowsSender = await prisma.follow.findUnique({
    where: { followerId_creatorId: { followerId: otherUserId, creatorId: viewerId } },
    select: { followerId: true },
  });
  const accepted = recipientFollowsSender !== null;
  const created = await prisma.conversation.create({
    data: {
      pairKey,
      status: accepted ? "ACCEPTED" : "PENDING",
      requestedById: accepted ? null : viewerId,
      participants: { create: [{ userId: viewerId }, { userId: otherUserId }] },
    },
    select: { id: true },
  });
  return created.id;
}

/**
 * Creates a group conversation with the creator and the given members, always
 * accepted. Requires at least two other valid members; the title is optional.
 *
 * @param creatorId - The user creating the group.
 * @param memberIds - The other members to add.
 * @param title - An optional group name.
 * @returns The new conversation id, or null when there aren't enough members.
 */
export async function createGroupConversation(
  creatorId: string,
  memberIds: string[],
  title: string | null,
): Promise<string | null> {
  const uniqueMembers = [...new Set(memberIds.filter((id) => id !== creatorId))];
  if (uniqueMembers.length < 2) {
    return null;
  }
  const existing = await prisma.user.findMany({
    where: { id: { in: uniqueMembers } },
    select: { id: true },
  });
  const validIds = existing.map((user) => user.id);
  if (validIds.length < 2) {
    return null;
  }
  const trimmed = title === null ? "" : title.trim();
  const created = await prisma.conversation.create({
    data: {
      title: trimmed === "" ? null : trimmed.slice(0, 80),
      status: "ACCEPTED",
      participants: { create: [creatorId, ...validIds].map((userId) => ({ userId })) },
    },
    select: { id: true },
  });
  return created.id;
}

/**
 * The Prisma select used to build a conversation summary for the inbox and the
 * requests list: the other participant, the last message and the read marker.
 *
 * @param userId - The current user id (excluded from the other participant).
 * @returns The participant select.
 */
function summarySelect(userId: string) {
  return {
    lastReadAt: true,
    conversation: {
      select: {
        id: true,
        updatedAt: true,
        title: true,
        participants: { where: { userId: { not: userId } }, select: { user: true } },
        messages: {
          orderBy: { createdAt: "desc" as const },
          take: 1,
          select: { body: true, createdAt: true, senderId: true, pinId: true, imageUrl: true },
        },
      },
    },
  };
}

type SummaryRow = {
  lastReadAt: Date | null;
  conversation: {
    id: string;
    updatedAt: Date;
    title: string | null;
    participants: { user: CreatorRow }[];
    messages: {
      body: string;
      createdAt: Date;
      senderId: string;
      pinId: string | null;
      imageUrl: string | null;
    }[];
  };
};

/**
 * Builds the inbox preview text for a conversation's last message, labelling pin
 * and image/GIF attachments that carry no text.
 *
 * @param message - The last message's body and attachment markers.
 * @returns The preview text.
 */
function previewBody(message: {
  body: string;
  pinId: string | null;
  imageUrl: string | null;
}): string {
  if (message.body !== "") {
    return message.body;
  }
  if (message.pinId !== null) {
    return "Sent a pin";
  }
  if (message.imageUrl !== null) {
    return /\.gif($|\?)/i.test(message.imageUrl) ? "Sent a GIF" : "Sent a photo";
  }
  return message.body;
}

/**
 * Maps a participant row to a conversation summary, computing the unread count.
 *
 * @param row - The participant row with its conversation, other party and last
 *   message.
 * @param userId - The current user id.
 * @returns The conversation summary.
 */
async function toSummary(row: SummaryRow, userId: string): Promise<ConversationSummary> {
  const conversation = row.conversation;
  const others = conversation.participants.map((participant) => toCreator(participant.user));
  const unknown: Creator = {
    id: "",
    name: "Unknown",
    username: null,
    bio: null,
    avatarUrl: null,
    followersLabel: null,
    verified: false,
  };
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
    other: others[0] ?? unknown,
    others,
    title: conversation.title,
    isGroup: others.length > 1,
    lastMessage:
      last === null
        ? null
        : {
            body: previewBody(last),
            createdAt: last.createdAt.toISOString(),
            senderId: last.senderId,
          },
    unreadCount,
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

/**
 * Fetches conversation summaries for the current user matching a conversation
 * filter, most recent activity first.
 *
 * @param userId - The current user id.
 * @param where - The conversation filter (status / requester).
 * @returns The matching conversation summaries.
 */
async function fetchSummaries(
  userId: string,
  where: Prisma.ConversationWhereInput,
): Promise<ConversationSummary[]> {
  const hidden = await getHiddenUserIds(userId);
  const conversation: Prisma.ConversationWhereInput =
    hidden.length > 0 ? { ...where, participants: { none: { userId: { in: hidden } } } } : where;
  const rows = await prisma.conversationParticipant.findMany({
    where: { userId, conversation },
    orderBy: { conversation: { updatedAt: "desc" } },
    select: summarySelect(userId),
  });
  return Promise.all(rows.map((row) => toSummary(row, userId)));
}

/**
 * Fetches a user's conversations, most recent activity first, each with the
 * other participant, the last message preview and the unread count.
 *
 * @param userId - The current user id.
 * @returns The user's conversation summaries.
 */
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  return fetchSummaries(userId, {
    OR: [{ status: "ACCEPTED" }, { status: "PENDING", requestedById: userId }],
  });
}

/**
 * Fetches the user's incoming message requests: pending conversations started by
 * someone else (the recipient hasn't accepted them yet).
 *
 * @param userId - The current user id.
 * @returns The pending request summaries.
 */
export async function getMessageRequests(userId: string): Promise<ConversationSummary[]> {
  return fetchSummaries(userId, { status: "PENDING", requestedById: { not: userId } });
}

/**
 * Returns the ids of the user's conversations that have unread messages (any
 * message from the other participant after the user's last-read marker). Used to
 * seed the navigation unread badge.
 *
 * @param userId - The current user id.
 * @returns The ids of conversations with unread messages.
 */
export async function getUnreadConversationIds(userId: string): Promise<string[]> {
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId, conversation: { status: "ACCEPTED" } },
    select: { conversationId: true, lastReadAt: true },
  });
  const ids: string[] = [];
  await Promise.all(
    parts.map(async (part) => {
      const unread = await prisma.message.count({
        where: {
          conversationId: part.conversationId,
          senderId: { not: userId },
          createdAt: { gt: part.lastReadAt ?? EPOCH },
        },
      });
      if (unread > 0) {
        ids.push(part.conversationId);
      }
    }),
  );
  return ids;
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
    include: { pin: MESSAGE_PIN_SELECT },
  });
  return rows.reverse().map(toMessage);
}
