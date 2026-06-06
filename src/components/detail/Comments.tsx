"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { Avatar, Button, ConfirmDialog, IconButton, Textarea } from "@/components/ui";
import { TrashIcon } from "@/icons";
import { formatRelativeTime } from "@/lib/time";
import { addComment, deleteComment } from "@/server/actions/comments";
import type { PinComment } from "@/types/domain";

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
 * Comments section for the pin detail: the list of comments and, for signed-in
 * users, an add form. Comments can be removed by their author or the pin owner.
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
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const text = body.trim();
    if (text === "") {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addComment(pinId, text);
      if (result.ok) {
        setComments((current) => [...current, result.comment]);
        setBody("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const onDelete = (id: string): void => {
    const previous = comments;
    setComments((current) => current.filter((comment) => comment.id !== id));
    startTransition(async () => {
      const result = await deleteComment(id);
      if (result.ok) {
        router.refresh();
      } else {
        setComments(previous);
      }
    });
  };

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-bold text-ink">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {comments.length === 0 ? (
        <p className="text-ink-soft">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-3">
              <Link
                href={comment.author.username !== null ? `/u/${comment.author.username}` : "#"}
                className="shrink-0"
              >
                <Avatar
                  src={comment.author.avatarUrl ?? undefined}
                  name={comment.author.name}
                  size={36}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold text-ink">{comment.author.name}</span>{" "}
                  <span className="text-ink-soft">{formatRelativeTime(comment.createdAt)}</span>
                </p>
                <p className="break-words text-[15px] text-ink">{comment.body}</p>
              </div>
              {viewerId === comment.author.id || isPinOwner ? (
                <IconButton
                  label="Delete comment"
                  size="sm"
                  className="shrink-0 text-ink-soft hover:text-accent"
                  onClick={() => setConfirmId(comment.id)}
                >
                  <TrashIcon size={18} />
                </IconButton>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {viewerId !== null ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <Textarea
            label="Add a comment"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Add a comment"
            rows={2}
            error={error ?? undefined}
          />
          <Button type="submit" className="self-end" disabled={body.trim() === ""}>
            Comment
          </Button>
        </form>
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
