"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/server/notifications";
import { aggregateReactions, toComment } from "@/server/services/comments";
import { searchMentionUsers } from "@/server/services/users";
import type { CommentReaction, MentionSuggestion, PinComment } from "@/types/domain";

const commentSchema = z.object({
  body: z.string().trim().min(1, "Write something first.").max(1000),
});

const reactionSchema = z.object({
  emoji: z.string().trim().min(1).max(16),
});

const MENTION_PATTERN = /@([a-zA-Z0-9_]+)/g;

/**
 * Extracts the unique usernames mentioned with an "@" in a comment body.
 *
 * @param body - The comment text.
 * @returns The distinct mentioned usernames, without the leading "@".
 */
function parseMentions(body: string): string[] {
  const matches = body.match(MENTION_PATTERN) ?? [];
  return [...new Set(matches.map((match) => match.slice(1)))];
}

/**
 * Notifies the users mentioned in a comment body, skipping the actor and any
 * recipients who were already notified for the same comment (e.g. the pin
 * owner or the replied-to author).
 *
 * @param body - The comment text to scan for mentions.
 * @param context - The actor, target pin and comment, and ids to skip.
 */
async function notifyMentions(
  body: string,
  context: { actorId: string; pinId: string; commentId: string; skip: Set<string> },
): Promise<void> {
  const usernames = parseMentions(body);
  if (usernames.length === 0) {
    return;
  }
  const users = await prisma.user.findMany({
    where: { username: { in: usernames } },
    select: { id: true },
  });
  for (const user of users) {
    if (user.id === context.actorId || context.skip.has(user.id)) {
      continue;
    }
    await createNotification({
      type: "MENTION",
      recipientId: user.id,
      actorId: context.actorId,
      pinId: context.pinId,
      commentId: context.commentId,
    });
  }
}

/**
 * Searches users to suggest while typing an @mention in a comment composer.
 *
 * @param query - The partial handle or name typed after the "@".
 * @returns The matching mention suggestions, or an empty list when signed out.
 */
export async function searchMentions(query: string): Promise<MentionSuggestion[]> {
  const user = await getCurrentUser();
  if (user === null) {
    return [];
  }
  return searchMentionUsers(query, user.id);
}

/**
 * Adds a comment to a pin on behalf of the current user.
 *
 * @param pinId - The pin id.
 * @param body - The comment text.
 * @returns The created comment, or a validation error.
 */
export async function addComment(
  pinId: string,
  body: string,
): Promise<{ ok: true; comment: PinComment } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in to comment." };
  }
  const parsed = commentSchema.safeParse({ body });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }
  const row = await prisma.comment.create({
    data: { pinId, authorId: user.id, body: parsed.data.body },
    include: { author: true, pin: { select: { creatorId: true } } },
  });
  await createNotification({
    type: "COMMENT",
    recipientId: row.pin.creatorId,
    actorId: user.id,
    pinId,
    commentId: row.id,
  });
  await notifyMentions(parsed.data.body, {
    actorId: user.id,
    pinId,
    commentId: row.id,
    skip: new Set([row.pin.creatorId]),
  });
  revalidatePath(`/pin/${pinId}`);
  revalidatePath("/");
  return { ok: true, comment: toComment(row) };
}

/**
 * Replies to a comment. Threads stay flat: a reply to a reply is attached to
 * the same root comment, and the author of the targeted comment is notified.
 *
 * @param pinId - The pin id.
 * @param targetCommentId - The comment being replied to.
 * @param body - The reply text.
 * @returns The created reply, or a validation error.
 */
export async function addReply(
  pinId: string,
  targetCommentId: string,
  body: string,
): Promise<{ ok: true; comment: PinComment } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in to reply." };
  }
  const parsed = commentSchema.safeParse({ body });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid reply." };
  }
  const target = await prisma.comment.findUnique({
    where: { id: targetCommentId },
    select: { id: true, authorId: true, parentId: true, pinId: true },
  });
  if (target === null || target.pinId !== pinId) {
    return { ok: false, error: "Comment not found." };
  }
  const rootId = target.parentId ?? target.id;
  const row = await prisma.comment.create({
    data: { pinId, authorId: user.id, body: parsed.data.body, parentId: rootId },
    include: { author: true },
  });
  await createNotification({
    type: "REPLY",
    recipientId: target.authorId,
    actorId: user.id,
    pinId,
    commentId: row.id,
  });
  await notifyMentions(parsed.data.body, {
    actorId: user.id,
    pinId,
    commentId: row.id,
    skip: new Set([target.authorId]),
  });
  revalidatePath(`/pin/${pinId}`);
  return { ok: true, comment: toComment(row) };
}

/**
 * Deletes a comment. Allowed for the comment's author or the pin's owner.
 *
 * @param commentId - The comment id.
 * @returns Whether the deletion succeeded, with an error otherwise.
 */
export async function deleteComment(
  commentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in." };
  }
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, pinId: true, pin: { select: { creatorId: true } } },
  });
  if (comment === null) {
    return { ok: false, error: "Comment not found." };
  }
  if (comment.authorId !== user.id && comment.pin.creatorId !== user.id) {
    return { ok: false, error: "You cannot delete this comment." };
  }
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/pin/${comment.pinId}`);
  revalidatePath("/");
  return { ok: true };
}

/**
 * Toggles the current user's emoji reaction on a comment: adds it if absent,
 * removes it otherwise. The comment's author is notified when a reaction is
 * added (never on removal, and never for self-reactions).
 *
 * @param commentId - The comment id.
 * @param emoji - The reaction emoji.
 * @returns The comment's updated reactions for the current viewer, or an error.
 */
export async function toggleReaction(
  commentId: string,
  emoji: string,
): Promise<{ ok: true; reactions: CommentReaction[] } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, error: "You must be signed in to react." };
  }
  const parsed = reactionSchema.safeParse({ emoji });
  if (!parsed.success) {
    return { ok: false, error: "Invalid reaction." };
  }
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, pinId: true },
  });
  if (comment === null) {
    return { ok: false, error: "Comment not found." };
  }
  const where = {
    commentId_userId_emoji: { commentId, userId: user.id, emoji: parsed.data.emoji },
  };
  const existing = await prisma.commentReaction.findUnique({ where });
  if (existing === null) {
    await prisma.commentReaction.create({
      data: { commentId, userId: user.id, emoji: parsed.data.emoji },
    });
    await createNotification({
      type: "REACTION",
      recipientId: comment.authorId,
      actorId: user.id,
      pinId: comment.pinId,
      commentId,
    });
  } else {
    await prisma.commentReaction.delete({ where });
  }
  const rows = await prisma.commentReaction.findMany({
    where: { commentId },
    select: { emoji: true, userId: true },
  });
  revalidatePath(`/pin/${comment.pinId}`);
  return { ok: true, reactions: aggregateReactions(rows, user.id) };
}
