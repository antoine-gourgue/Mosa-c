"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/server/notifications";
import { toComment } from "@/server/services/comments";
import type { PinComment } from "@/types/domain";

const commentSchema = z.object({
  body: z.string().trim().min(1, "Write something first.").max(1000),
});

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
  return { ok: true };
}
