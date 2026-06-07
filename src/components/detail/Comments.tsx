"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent, ReactElement, ReactNode } from "react";
import { Avatar, Button, ConfirmDialog, IconButton } from "@/components/ui";
import { TrashIcon } from "@/icons";
import { formatRelativeTime } from "@/lib/time";
import { useEngagementActions } from "@/components/engagement";
import { addComment, addReply, deleteComment } from "@/server/actions/comments";
import type { PinComment } from "@/types/domain";
import { CommentReactions } from "./CommentReactions";
import { MentionTextarea } from "./MentionTextarea";

const MENTION_PATTERN = /@([a-zA-Z0-9_]+)/g;

/**
 * Renders a comment body as text with @mentions turned into links to the
 * mentioned user's profile.
 *
 * @param body - The raw comment text.
 * @returns The body content with linkified mentions.
 */
function renderBody(body: string): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of body.matchAll(MENTION_PATTERN)) {
    const start = match.index;
    if (start > last) {
      parts.push(body.slice(last, start));
    }
    parts.push(
      <Link
        key={start}
        href={`/u/${match[1]}`}
        className="font-semibold text-accent hover:underline"
      >
        {match[0]}
      </Link>,
    );
    last = start + match[0].length;
  }
  if (last < body.length) {
    parts.push(body.slice(last));
  }
  return parts;
}

/**
 * Props for the {@link Comments} component.
 */
export type CommentsProps = {
  pinId: string;
  initialComments: PinComment[];
  viewerId: string | null;
  isPinOwner: boolean;
};

/**
 * Comments section for the pin detail: root comments with one level of replies,
 * a compact inline reply composer, a show/hide replies affordance and, for
 * signed-in users, an add form. Comments can be removed by their author or the
 * pin owner. The per-comment action row leaves room for upcoming reactions.
 *
 * @param props - The pin id, initial comments and viewer context.
 * @returns The comments section element.
 */
export function Comments({
  pinId,
  initialComments,
  viewerId,
  isPinOwner,
}: CommentsProps): ReactElement {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [, startTransition] = useTransition();
  const { setCommentCount } = useEngagementActions();
  const router = useRouter();
  const isAuthed = viewerId !== null;

  const total = comments.reduce((count, comment) => count + 1 + comment.replies.length, 0);

  const threadRootId = (commentId: string): string | null => {
    const root = comments.find(
      (comment) =>
        comment.id === commentId || comment.replies.some((reply) => reply.id === commentId),
    );
    return root?.id ?? null;
  };

  const submitComment = (): void => {
    const text = body.trim();
    if (text === "") {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addComment(pinId, text);
      if (result.ok) {
        setComments((current) => [...current, result.comment]);
        setCommentCount(pinId, total + 1);
        setBody("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submitComment();
  };

  const toggleReply = (comment: PinComment): void => {
    if (replyingTo === comment.id) {
      setReplyingTo(null);
      return;
    }
    setReplyingTo(comment.id);
    setReplyBody(comment.author.username !== null ? `@${comment.author.username} ` : "");
    const rootId = threadRootId(comment.id);
    if (rootId !== null) {
      setExpanded((prev) => new Set(prev).add(rootId));
    }
  };

  const submitReply = (): void => {
    const target = replyingTo;
    const text = replyBody.trim();
    if (target === null || text === "") {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addReply(pinId, target, text);
      if (result.ok) {
        const rootId = threadRootId(target);
        setComments((current) =>
          current.map((comment) =>
            comment.id === rootId
              ? { ...comment, replies: [...comment.replies, result.comment] }
              : comment,
          ),
        );
        setCommentCount(pinId, total + 1);
        setReplyingTo(null);
        setReplyBody("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const onSubmitReply = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submitReply();
  };

  const onDelete = (id: string): void => {
    const previous = comments;
    const root = comments.find((comment) => comment.id === id);
    const removed = root === undefined ? 1 : 1 + root.replies.length;
    setComments((current) =>
      current
        .filter((comment) => comment.id !== id)
        .map((comment) => ({
          ...comment,
          replies: comment.replies.filter((reply) => reply.id !== id),
        })),
    );
    setCommentCount(pinId, Math.max(0, total - removed));
    startTransition(async () => {
      const result = await deleteComment(id);
      if (result.ok) {
        router.refresh();
      } else {
        setComments(previous);
        setCommentCount(pinId, total);
      }
    });
  };

  const canDelete = (comment: PinComment): boolean => viewerId === comment.author.id || isPinOwner;

  const toggleExpanded = (rootId: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) {
        next.delete(rootId);
      } else {
        next.add(rootId);
      }
      return next;
    });
  };

  const renderRow = (comment: PinComment, isReply: boolean): ReactElement => (
    <div className="group/comment flex items-start gap-3">
      <Link
        href={comment.author.username !== null ? `/u/${comment.author.username}` : "#"}
        className="shrink-0"
      >
        <Avatar
          src={comment.author.avatarUrl ?? undefined}
          name={comment.author.name}
          size={isReply ? 28 : 36}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-ink">{comment.author.name}</p>
        <p className="break-words text-[15px] leading-snug text-ink">{renderBody(comment.body)}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-ink-soft">
          <span>{formatRelativeTime(comment.createdAt)}</span>
          {isAuthed ? (
            <button
              type="button"
              onClick={() => toggleReply(comment)}
              className="cursor-pointer py-0.5 font-semibold transition-colors hover:text-ink"
            >
              Reply
            </button>
          ) : null}
        </div>
        <CommentReactions
          commentId={comment.id}
          initialReactions={comment.reactions}
          isAuthed={isAuthed}
        />
      </div>
      {canDelete(comment) ? (
        <IconButton
          label="Delete comment"
          size="sm"
          className="shrink-0 text-ink-soft opacity-0 transition-opacity hover:text-accent group-hover/comment:opacity-100"
          onClick={() => setConfirmId(comment.id)}
        >
          <TrashIcon size={16} />
        </IconButton>
      ) : null}
    </div>
  );

  const replyComposer = (): ReactElement => (
    <form onSubmit={onSubmitReply} className="ml-11 flex items-start gap-2">
      <MentionTextarea
        ariaLabel="Reply"
        value={replyBody}
        onChange={setReplyBody}
        onSubmit={submitReply}
        placeholder="Write a reply…"
        rows={1}
        autoFocus
        className="min-h-[40px] w-full resize-none rounded-2xl bg-surface px-4 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:bg-surface-2"
      />
      <button
        type="button"
        onClick={() => setReplyingTo(null)}
        className="h-10 shrink-0 cursor-pointer px-2 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        Cancel
      </button>
      <Button type="submit" disabled={replyBody.trim() === ""}>
        Post
      </Button>
    </form>
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-ink">
        {total} {total === 1 ? "comment" : "comments"}
      </h2>

      {comments.length === 0 ? (
        <p className="text-ink-soft">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {comments.map((root) => (
            <li key={root.id} className="flex flex-col gap-3">
              {renderRow(root, false)}

              {root.replies.length > 0 ? (
                <button
                  type="button"
                  onClick={() => toggleExpanded(root.id)}
                  className="ml-11 flex w-fit cursor-pointer items-center gap-2 py-0.5 text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
                >
                  <span className="h-px w-6 bg-line" />
                  {expanded.has(root.id)
                    ? "Hide replies"
                    : `View ${root.replies.length} ${root.replies.length === 1 ? "reply" : "replies"}`}
                </button>
              ) : null}

              {expanded.has(root.id) ? (
                <ul className="ml-11 flex flex-col gap-4">
                  {root.replies.map((reply) => (
                    <li key={reply.id}>{renderRow(reply, true)}</li>
                  ))}
                </ul>
              ) : null}

              {replyingTo !== null && threadRootId(replyingTo) === root.id ? replyComposer() : null}
            </li>
          ))}
        </ul>
      )}

      {isAuthed ? (
        <form onSubmit={onSubmit} className="flex items-start gap-2">
          <MentionTextarea
            ariaLabel="Add a comment"
            value={body}
            onChange={setBody}
            onSubmit={submitComment}
            placeholder="Add a comment"
            rows={1}
            className="min-h-[44px] w-full resize-none rounded-2xl bg-surface px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:bg-surface-2"
          />
          <Button type="submit" className="h-11" disabled={body.trim() === ""}>
            Comment
          </Button>
        </form>
      ) : (
        <Link href="/login" className="text-sm font-semibold text-accent hover:underline">
          Log in to comment
        </Link>
      )}
      {error !== null ? (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete comment?"
        description="This comment will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (confirmId !== null) {
            onDelete(confirmId);
          }
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </section>
  );
}
