"use server";

import { prisma } from "@/lib/prisma";
import { errorMessage } from "@/server/error-message";
import { getCurrentUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import {
  createGroupConversation,
  getConversations,
  getMessageRequests,
  getMessages,
  getOrCreateConversation,
  MESSAGE_PIN_SELECT,
  toMessage,
} from "@/server/services/messages";
import { getHiddenUserIds } from "@/server/services/blocks";
import { getSuggestedCreators, searchMentionUsers } from "@/server/services/users";
import type { ChatMessage, ConversationSummary, Creator } from "@/types/domain";

/**
 * Sends a message — text, a shared pin, or both — to a conversation on behalf of
 * the current user. The caller must be a participant. The conversation's
 * activity timestamp is bumped so it sorts to the top of the inbox.
 *
 * @param conversationId - The conversation id.
 * @param body - The message text (may be empty when a pin or image is attached).
 * @param pinId - An optional pin to attach to the message.
 * @param imageUrl - An optional uploaded image/GIF to attach to the message.
 * @returns The created message, or a validation/authorization error.
 */
export async function sendMessage(
  conversationId: string,
  body: string,
  pinId: string | null = null,
  imageUrl: string | null = null,
  system = false,
): Promise<{ ok: true; message: ChatMessage } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOutSend") };
  }
  const text = body.trim();
  if (text === "" && pinId === null && imageUrl === null) {
    return { ok: false, error: await errorMessage("writeMessage") };
  }
  if (text.length > 4000) {
    return { ok: false, error: await errorMessage("messageTooLong") };
  }
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { some: { userId: user.id } } },
    select: {
      status: true,
      requestedById: true,
      participants: { select: { userId: true } },
    },
  });
  if (conversation === null) {
    return { ok: false, error: await errorMessage("conversationNotFound") };
  }
  if (conversation.status === "PENDING" && conversation.requestedById !== user.id) {
    return { ok: false, error: await errorMessage("acceptToReply") };
  }
  const hidden = await getHiddenUserIds(user.id);
  if (
    hidden.length > 0 &&
    conversation.participants.some((participant) => hidden.includes(participant.userId))
  ) {
    return { ok: false, error: await errorMessage("cannotMessageBlocked") };
  }
  let sharedPinId: string | null = null;
  if (pinId !== null) {
    const pin = await prisma.pin.findUnique({ where: { id: pinId }, select: { id: true } });
    if (pin === null) {
      return { ok: false, error: await errorMessage("pinGone") };
    }
    sharedPinId = pin.id;
  }
  const [row] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: user.id, body: text, pinId: sharedPinId, imageUrl, system },
      include: { pin: MESSAGE_PIN_SELECT },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return { ok: true, message: toMessage(row) };
}

/**
 * Maximum accepted size for an image/GIF attached to a message.
 */
const MAX_MESSAGE_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Uploads an image or GIF to attach to a message, reusing the app's storage
 * backend. Returns its URL, which the caller then sends with {@link sendMessage}
 * (or the realtime socket).
 *
 * @param formData - Form data carrying the `image` file.
 * @returns The stored image URL, or a validation error.
 */
export async function uploadMessageImage(
  formData: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: await errorMessage("chooseImage") };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: await errorMessage("fileNotImage") };
  }
  if (file.size > MAX_MESSAGE_IMAGE_BYTES) {
    return { ok: false, error: await errorMessage("imageUnder10") };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await getStorage().put(buffer, { filename: file.name, contentType: file.type });
  return { ok: true, url: stored.url };
}

/**
 * A GIF result from the picker.
 */
export type GifResult = { id: string; url: string; preview: string };

/**
 * Searches GIFs through Giphy (or returns trending GIFs for a blank query) for
 * the message composer's GIF picker. Reads `GIPHY_API_KEY` directly so the
 * feature stays optional: with no key it returns an empty list and never calls
 * out, keeping it free by default.
 *
 * @param query - The free-text GIF search query.
 * @returns The matching GIFs (sendable URL + preview), or an empty list.
 */
export async function searchGifs(query: string): Promise<{ gifs: GifResult[] }> {
  const key = process.env.GIPHY_API_KEY;
  if (key === undefined || key === "") {
    return { gifs: [] };
  }
  const q = query.trim();
  const endpoint = q === "" ? "trending" : "search";
  const params = new URLSearchParams({ api_key: key, limit: "24", rating: "g" });
  if (q !== "") {
    params.set("q", q);
  }
  try {
    const response = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}?${params.toString()}`);
    if (!response.ok) {
      return { gifs: [] };
    }
    const json = (await response.json()) as {
      data?: {
        id: string;
        images?: {
          fixed_height?: { url?: string };
          fixed_height_small?: { url?: string };
        };
      }[];
    };
    const gifs: GifResult[] = [];
    for (const item of json.data ?? []) {
      const url = item.images?.fixed_height?.url;
      if (typeof url === "string") {
        gifs.push({ id: item.id, url, preview: item.images?.fixed_height_small?.url ?? url });
      }
    }
    return { gifs };
  } catch {
    return { gifs: [] };
  }
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
    return { ok: false, error: await errorMessage("signedOut") };
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
    return { ok: false, error: await errorMessage("signedOut") };
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
    return { ok: false, error: await errorMessage("signedOut") };
  }
  const messages = await getMessages(conversationId, user.id);
  if (messages === null) {
    return { ok: false, error: await errorMessage("conversationNotFound") };
  }
  return { ok: true, messages };
}

/**
 * Creates a group conversation with the chosen members and an optional name.
 *
 * @param memberIds - The other members to add (at least two).
 * @param title - An optional group name.
 * @returns The new conversation id, or a validation error.
 */
export async function createGroup(
  memberIds: string[],
  title: string,
): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  const conversationId = await createGroupConversation(user.id, memberIds, title);
  if (conversationId === null) {
    return { ok: false, error: await errorMessage("groupMinPeople") };
  }
  return { ok: true, conversationId };
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
    return { ok: false, error: await errorMessage("signedOut") };
  }
  const result = await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: user.id },
    data: { lastReadAt: new Date() },
  });
  if (result.count === 0) {
    return { ok: false, error: await errorMessage("conversationNotFound") };
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
    return { ok: false, error: await errorMessage("signedOutMessage") };
  }
  const conversationId = await getOrCreateConversation(user.id, otherUserId);
  if (conversationId === null) {
    return { ok: false, error: await errorMessage("cannotMessageUser") };
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
    return { ok: false, error: await errorMessage("signedOut") };
  }
  const result = await prisma.conversation.deleteMany({
    where: { id: conversationId, participants: { some: { userId: user.id } } },
  });
  if (result.count === 0) {
    return { ok: false, error: await errorMessage("conversationNotFound") };
  }
  return { ok: true };
}

/**
 * Removes the current user from a (group) conversation without deleting it for
 * everyone. The conversation is dropped only once fewer than two members remain.
 *
 * @param conversationId - The conversation id.
 * @returns Whether the user left.
 */
export async function leaveConversation(
  conversationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: await errorMessage("signedOut") };
  }
  const removed = await prisma.conversationParticipant.deleteMany({
    where: { conversationId, userId: user.id },
  });
  if (removed.count === 0) {
    return { ok: false, error: await errorMessage("conversationNotFound") };
  }
  const remaining = await prisma.conversationParticipant.count({ where: { conversationId } });
  if (remaining < 2) {
    await prisma.conversation.delete({ where: { id: conversationId } }).catch(() => undefined);
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
    return { ok: false, error: await errorMessage("signedOut") };
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
    return { ok: false, error: await errorMessage("requestNotFound") };
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
    return { ok: false, error: await errorMessage("signedOut") };
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
    return { ok: false, error: await errorMessage("requestNotFound") };
  }
  return { ok: true };
}
