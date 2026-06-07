"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getMessages,
  getOrCreateConversation,
  isParticipant,
  toMessage,
} from "@/server/services/messages";
import type { ChatMessage } from "@/types/domain";

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
  if (!(await isParticipant(conversationId, user.id))) {
    return { ok: false, error: "Conversation not found." };
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
 * Starts (or reopens) a 1:1 conversation with another user. Creating a new
 * conversation requires the two users to follow each other.
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
    return { ok: false, error: "You can only message people you both follow." };
  }
  return { ok: true, conversationId };
}
