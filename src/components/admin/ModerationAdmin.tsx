"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";
import { SearchIcon } from "@/icons";
import { cn } from "@/lib/cn";
import type {
  AdminCommentRow,
  AdminCommentsPage,
  AdminPinRow,
  AdminPinsPage,
} from "@/server/services";
import { AdminRemoveAction } from "./AdminRemoveAction";
import { DataTable } from "./DataTable";
import type { Column } from "./DataTable";

/**
 * Props for the {@link ModerationAdmin} component.
 */
export type ModerationAdminProps =
  | { tab: "pins"; query: string; pins: AdminPinsPage }
  | { tab: "comments"; query: string; comments: AdminCommentsPage };

/**
 * Builds the moderation route URL for a tab, search term and page.
 *
 * @param tab - The active tab.
 * @param query - The search term.
 * @param page - The 1-based page number.
 * @returns The relative URL.
 */
function moderationHref(tab: "pins" | "comments", query: string, page: number): string {
  const params = new URLSearchParams();
  if (tab !== "pins") {
    params.set("tab", tab);
  }
  if (query.trim() !== "") {
    params.set("q", query.trim());
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const search = params.toString();
  return search === "" ? "/admin/moderation" : `/admin/moderation?${search}`;
}

/**
 * Formats a date as a short, locale-aware day.
 *
 * @param date - The date to format.
 * @returns The formatted day string.
 */
function day(date: Date): string {
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const PIN_COLUMNS: Column<AdminPinRow>[] = [
  {
    key: "pin",
    header: "Pin",
    render: (pin) => <span className="font-semibold text-ink">{pin.title}</span>,
  },
  { key: "creator", header: "Creator", render: (pin) => pin.creatorName },
  {
    key: "engagement",
    header: "Engagement",
    render: (pin) => `${pin.likeCount} likes · ${pin.commentCount} comments`,
  },
  { key: "created", header: "Created", render: (pin) => day(pin.createdAt) },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: (pin) => (
      <div className="flex justify-end">
        <AdminRemoveAction
          kind="pin"
          id={pin.id}
          description={`"${pin.title}" and its likes, comments and saves will be permanently removed.`}
        />
      </div>
    ),
  },
];

const COMMENT_COLUMNS: Column<AdminCommentRow>[] = [
  {
    key: "comment",
    header: "Comment",
    render: (comment) => <span className="line-clamp-2 max-w-md text-ink">{comment.body}</span>,
  },
  { key: "author", header: "Author", render: (comment) => comment.authorName },
  {
    key: "pin",
    header: "On pin",
    render: (comment) => (
      <Link href={`/pin/${comment.pinId}`} className="text-ink-soft hover:underline">
        {comment.pinTitle}
      </Link>
    ),
  },
  { key: "created", header: "Created", render: (comment) => day(comment.createdAt) },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: (comment) => (
      <div className="flex justify-end">
        <AdminRemoveAction
          kind="comment"
          id={comment.id}
          description="This comment will be permanently removed."
        />
      </div>
    ),
  },
];

/**
 * Admin content moderation: tabs for pins and comments, a search field over the
 * pins, paginated tables and a per-row remove action.
 *
 * @param props - The active tab, search term and the matching page of data.
 * @returns The moderation element.
 */
export function ModerationAdmin(props: ModerationAdminProps): ReactElement {
  const router = useRouter();
  const [term, setTerm] = useState(props.query);

  const onSearch = (value: string): void => {
    setTerm(value);
    router.push(moderationHref("pins", value, 1));
  };

  const data = props.tab === "pins" ? props.pins : props.comments;
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-extrabold text-ink">Moderation</h1>

      <div className="mt-4 flex gap-1 border-b border-line">
        {(["pins", "comments"] as const).map((tab) => (
          <Link
            key={tab}
            href={moderationHref(tab, tab === "pins" ? term : "", 1)}
            aria-current={props.tab === tab ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-[15px] font-semibold capitalize transition-colors",
              props.tab === tab
                ? "border-ink text-ink"
                : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {tab}
          </Link>
        ))}
      </div>

      {props.tab === "pins" ? (
        <div className="relative mt-5 max-w-md">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">
            <SearchIcon size={18} />
          </span>
          <input
            value={term}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search pins by title or description"
            aria-label="Search pins"
            className="h-11 w-full rounded-2xl bg-bg pl-11 pr-4 text-[15px] text-ink outline-none ring-1 ring-line focus:ring-ink-faint"
          />
        </div>
      ) : null}

      <div className="mt-5">
        {props.tab === "pins" ? (
          <DataTable
            columns={PIN_COLUMNS}
            rows={props.pins.rows}
            getRowKey={(pin) => pin.id}
            empty="No pins found."
          />
        ) : (
          <DataTable
            columns={COMMENT_COLUMNS}
            rows={props.comments.rows}
            getRowKey={(comment) => comment.id}
            empty="No comments yet."
          />
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between text-sm text-ink-soft">
          <span>
            Page {data.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <PageLink
              href={moderationHref(props.tab, term, data.page - 1)}
              disabled={data.page <= 1}
            >
              Previous
            </PageLink>
            <PageLink
              href={moderationHref(props.tab, term, data.page + 1)}
              disabled={data.page >= totalPages}
            >
              Next
            </PageLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * A pagination link that renders as a disabled control at the range ends.
 *
 * @param props - The destination, disabled state and label.
 * @param props.href - The destination URL.
 * @param props.disabled - Whether the link is inactive.
 * @param props.children - The link label.
 * @returns The pagination control element.
 */
function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactElement | string;
}): ReactElement {
  if (disabled) {
    return (
      <span className="cursor-not-allowed rounded-full px-4 py-2 font-semibold text-ink-faint">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 font-semibold text-ink transition-colors hover:bg-surface"
    >
      {children}
    </Link>
  );
}
