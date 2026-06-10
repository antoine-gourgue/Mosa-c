"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent, ReactElement, ReactNode } from "react";
import { Avatar, ConfirmDialog, IconButton } from "@/components/ui";
import { CloseIcon, SendIcon, TrashIcon } from "@/icons";
import { useTimeFormat } from "@/hooks/use-time-format";
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
  header?: ReactNode;
};

/**
 * Comments section for the pin detail: a scrollable thread (root comments with
 * one level of replies) above a pinned composer that never grows the surrounding
 * card. Replies reuse the single composer — pressing Reply targets a comment and
 * shows a "Replying to" banner, Instagram-style. Comments can be removed by their
 * author or the pin owner.
 *
 * @param props - The pin id, initial comments, viewer context and an optional
 *   header rendered above the thread inside the scroll area.
 * @returns The comments section element.
 */
export function Comments({
  pinId,
  initialComments,
  viewerId,
  isPinOwner,
  header,
}: CommentsProps): ReactElement {
  const t = useTranslations("detail");
  const time = useTimeFormat();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<PinComment | null>(null);
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

  const submit = (): void => {
    const text = body.trim();
    if (text === "") {
      return;
    }
    setError(null);
    const target = replyTarget;
    startTransition(async () => {
      if (target !== null) {
        const result = await addReply(pinId, target.id, text);
        if (result.ok) {
          const rootId = threadRootId(target.id);
          setComments((current) =>
            current.map((comment) =>
              comment.id === rootId
                ? { ...comment, replies: [...comment.replies, result.comment] }
                : comment,
            ),
          );
          setCommentCount(pinId, total + 1);
          setBody("");
          setReplyTarget(null);
          router.refresh();
        } else {
          setError(result.error);
        }
        return;
      }
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
    submit();
  };

  const startReply = (comment: PinComment): void => {
    setReplyTarget(comment);
    const rootId = threadRootId(comment.id);
    if (rootId !== null) {
      setExpanded((prev) => new Set(prev).add(rootId));
    }
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
          <span>{time.relative(comment.createdAt)}</span>
          {isAuthed ? (
            <button
              type="button"
              onClick={() => startReply(comment)}
              className="cursor-pointer py-0.5 font-semibold transition-colors hover:text-ink"
            >
              {t("reply")}
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
          label={t("deleteComment")}
          size="sm"
          className="shrink-0 text-ink-soft opacity-0 transition-opacity hover:text-accent group-hover/comment:opacity-100"
          onClick={() => setConfirmId(comment.id)}
        >
          <TrashIcon size={16} />
        </IconButton>
      ) : null}
    </div>
  );

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 md:px-8">
        {header}

        <h2 className="pb-3 pt-5 font-bold text-ink">{t("commentCount", { count: total })}</h2>

        {comments.length === 0 ? (
          <p className="pb-2 text-ink-soft">{t("noComments")}</p>
        ) : (
          <ul className="flex flex-col gap-5 pb-2">
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
                      ? t("hideReplies")
                      : t("viewReplies", { count: root.replies.length })}
                  </button>
                ) : null}

                {expanded.has(root.id) ? (
                  <ul className="ml-11 flex flex-col gap-4">
                    {root.replies.map((reply) => (
                      <li key={reply.id}>{renderRow(reply, true)}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-line px-5 py-3 md:px-8">
        {replyTarget !== null ? (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-1.5">
            <span className="truncate text-xs text-ink-soft">
              {t("replyingTo")}{" "}
              <span className="font-semibold text-ink">{replyTarget.author.name}</span>
            </span>
            <button
              type="button"
              aria-label={t("cancelReply")}
              onClick={() => setReplyTarget(null)}
              className="grid size-5 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        ) : null}
        {error !== null ? (
          <p role="alert" className="mb-2 text-sm text-accent">
            {error}
          </p>
        ) : null}
        {isAuthed ? (
          <form
            onSubmit={onSubmit}
            className="flex items-end gap-2 rounded-2xl bg-surface px-3 py-1.5 transition-colors focus-within:bg-surface-2"
          >
            <MentionTextarea
              key={replyTarget?.id ?? "root"}
              ariaLabel={replyTarget !== null ? t("writeReply") : t("addComment")}
              value={body}
              onChange={setBody}
              onSubmit={submit}
              placeholder={replyTarget !== null ? t("writeReplyPlaceholder") : t("addComment")}
              rows={1}
              autoFocus={replyTarget !== null}
              className="min-h-[36px] w-full resize-none bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-ink-faint"
            />
            <button
              type="submit"
              aria-label={replyTarget !== null ? t("postReply") : t("postComment")}
              disabled={body.trim() === ""}
              className="mb-1 grid size-8 shrink-0 cursor-pointer place-items-center rounded-xl bg-accent text-bg transition-opacity hover:bg-accent-press disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendIcon size={18} />
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="inline-flex text-sm font-semibold text-accent hover:underline"
          >
            {t("logInToComment")}
          </Link>
        )}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        title={t("deleteCommentTitle")}
        description={t("deleteCommentBody")}
        confirmLabel={t("delete")}
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
