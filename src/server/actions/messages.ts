"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getConversations,
  getMessageRequests,
  getMessages,
  getOrCreateConversation,
  toMessage,
} from "@/server/services/messages";
import { getSuggestedCreators, searchMentionUsers } from "@/server/services/users";
import type { ChatMessage, ConversationSummary, Creator } from "@/types/domain";

const messageSchema = z.object({
  body: z.string().trim().min(1, "Write a message first.").max(4000),
});

/**
 * Sends a message to a conversation on behalf of the current user. The caller
 * must be a participant. The conversation's activity timestamp is bumped so it
 * sorts to the top of the inbox.
 *
 * @param conversationId - The conversation id.
 * @param body - The message text.
 * @returns The created message, or a validation/authorization error.
 */
export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<{ ok: true; message: ChatMessage } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in to send messages." };
  }
  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid message." };
  }
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId: user.id } } },
    select: { status: true, requestedById: true },
  });
  if (conversation === null) {
    return { ok: false, error: "Conversation not found." };
  }
  if (conversation.status === "PENDING" && conversation.requestedById !== user.id) {
    return { ok: false, error: "Accept the request to reply." };
  }
  const [row] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: user.id, body: parsed.data.body },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return { ok: true, message: toMessage(row) };
}

/**
 * Loads the current user's inbox: accepted conversations and pending message
 * requests. Used by the messages overlay panel to lazily fetch its contents the
 * first time it is opened, so the data is not fetched on every page render.
 *
 * @returns The conversations and requests, or an authorization error.
 */
export async function loadInbox(): Promise<
  | {
      ok: true;
      conversations: ConversationSummary[];
      requests: ConversationSummary[];
      suggestions: Creator[];
    }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const [conversations, requests, suggestions] = await Promise.all([
    getConversations(user.id),
    getMessageRequests(user.id),
    getSuggestedCreators(user.id, 4),
  ]);
  return { ok: true, conversations, requests, suggestions };
}

/**
 * Searches for users the current viewer can start a conversation with, by name
 * or username. Used by the messages panel's "new message" recipient picker.
 *
 * @param query - The free-text search query.
 * @returns The matching users (id, name, username, avatar), or an error.
 */
export async function searchRecipients(
  query: string,
): Promise<
  | { ok: true; users: { id: string; name: string; username: string; avatarUrl: string | null }[] }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const users = await searchMentionUsers(query, user.id, 8);
  return { ok: true, users };
}

/**
 * Loads a conversation's messages for the current user, after authorizing
 * membership. Used by the inbox to open a conversation on the client.
 *
 * @param conversationId - The conversation id.
 * @returns The messages oldest-first, or an authorization error.
 */
export async function fetchMessages(
  conversationId: string,
): Promise<{ ok: true; messages: ChatMessage[] } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const messages = await getMessages(conversationId, user.id);
  if (messages === null) {
    return { ok: false, error: "Conversation not found." };
  }
  return { ok: true, messages };
}

/**
 * Marks a conversation as read for the current user by advancing their
 * last-read timestamp to now.
 *
 * @param conversationId - The conversation id.
 * @returns Whether the update succeeded.
 */
export async function markConversationRead(
  conversationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const result = await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: user.id },
    data: { lastReadAt: new Date() },
  });
  if (result.count === 0) {
    return { ok: false, error: "Conversation not found." };
  }
  return { ok: true };
}

/**
 * Starts (or reopens) a 1:1 conversation with another user. Anyone may message
 * anyone: if the recipient does not already follow the sender, the conversation
 * starts as a pending request in the recipient's requests.
 *
 * @param otherUserId - The other participant's user id.
 * @returns The conversation id, or an authorization error.
 */
export async function startConversation(
  otherUserId: string,
): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in to message." };
  }
  const conversationId = await getOrCreateConversation(user.id, otherUserId);
  if (conversationId === null) {
    return { ok: false, error: "You can't message this user." };
  }
  return { ok: true, conversationId };
}

/**
 * Deletes a conversation the current user is a participant of, removing it (and
 * its messages, by cascade) for everyone. Used by the inbox swipe-to-delete
 * gesture.
 *
 * @param conversationId - The conversation id.
 * @returns Whether the conversation was deleted.
 */
export async function deleteConversation(
  conversationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const result = await prisma.conversation.deleteMany({
    where: { id: conversationId, participants: { some: { userId: user.id } } },
  });
  if (result.count === 0) {
    return { ok: false, error: "Conversation not found." };
  }
  return { ok: true };
}

/**
 * Accepts an incoming message request, moving the conversation into the main
 * inbox for both participants. Allowed only for the recipient of a pending
 * request (not the user who started it).
 *
 * @param conversationId - The conversation id.
 * @returns Whether the request was accepted.
 */
export async function acceptRequest(
  conversationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const result = await prisma.conversation.updateMany({
    where: {
      id: conversationId,
      status: "PENDING",
      requestedById: { not: user.id },
      participants: { some: { userId: user.id } },
    },
    data: { status: "ACCEPTED", requestedById: null },
  });
  if (result.count === 0) {
    return { ok: false, error: "Request not found." };
  }
  return { ok: true };
}

/**
 * Declines an incoming message request, deleting the conversation. Allowed only
 * for the recipient of a pending request.
 *
 * @param conversationId - The conversation id.
 * @returns Whether the request was declined.
 */
export async function declineRequest(
  conversationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const result = await prisma.conversation.deleteMany({
    where: {
      id: conversationId,
      status: "PENDING",
      requestedById: { not: user.id },
      participants: { some: { userId: user.id } },
    },
  });
  if (result.count === 0) {
    return { ok: false, error: "Request not found." };
  }
  return { ok: true };
}
