"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReactElement } from "react";
import { SearchIcon } from "@/icons";
import { cn } from "@/lib/cn";
import type { AdminUserRow, AdminUsersPage } from "@/server/services";
import { DataTable } from "./DataTable";
import type { Column } from "./DataTable";
import { UserRowActions } from "./UserRowActions";

/**
 * Props for the {@link UsersAdmin} component.
 */
export type UsersAdminProps = {
  data: AdminUsersPage;
  query: string;
  currentUserId: string;
};

/**
 * Builds the users route URL for a given search term and page.
 *
 * @param query - The search term.
 * @param page - The 1-based page number.
 * @returns The relative URL.
 */
function usersHref(query: string, page: number): string {
  const params = new URLSearchParams();
  if (query.trim() !== "") {
    params.set("q", query.trim());
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const search = params.toString();
  return search === "" ? "/admin/users" : `/admin/users?${search}`;
}

/**
 * Admin users management: a search field over a paginated table with per-row
 * actions (role, verification, ban, delete). Searching navigates as the term
 * changes so results stay shareable through the URL.
 *
 * @param props - The page of users, the active query and the current admin id.
 * @returns The users management element.
 */
export function UsersAdmin({ data, query, currentUserId }: UsersAdminProps): ReactElement {
  const router = useRouter();
  const [term, setTerm] = useState(query);

  const onSearch = (value: string): void => {
    setTerm(value);
    router.push(usersHref(value, 1));
  };

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const columns: Column<AdminUserRow>[] = [
    {
      key: "user",
      header: "User",
      render: (user) => (
        <div>
          <Link href={`/admin/users/${user.id}`} className="font-semibold text-ink hover:underline">
            {user.name}
            {user.verified ? <span className="ml-1 text-accent">✓</span> : null}
          </Link>
          <div className="text-ink-soft">{user.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            user.role === "ADMIN" ? "bg-accent/10 text-accent" : "bg-surface text-ink-soft",
          )}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) =>
        user.disabled ? (
          <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
            Banned
          </span>
        ) : (
          <span className="text-ink-soft">Active</span>
        ),
    },
    { key: "pins", header: "Pins", render: (user) => user.pinCount },
    {
      key: "joined",
      header: "Joined",
      render: (user) =>
        user.createdAt.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (user) => (
        <div className="flex justify-end">
          <UserRowActions user={user} isSelf={user.id === currentUserId} />
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-extrabold text-ink">Users</h1>
      <p className="mt-1 text-ink-soft">{data.total.toLocaleString()} total</p>

      <div className="relative mt-5 max-w-md">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">
          <SearchIcon size={18} />
        </span>
        <input
          value={term}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search by name, email or username"
          aria-label="Search users"
          className="h-11 w-full rounded-2xl bg-bg pl-11 pr-4 text-[15px] text-ink outline-none ring-1 ring-line focus:ring-ink-faint"
        />
      </div>

      <div className="mt-5">
        <DataTable
          columns={columns}
          rows={data.rows}
          getRowKey={(user) => user.id}
          empty="No users found."
        />
      </div>

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between text-sm text-ink-soft">
          <span>
            Page {data.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <PageLink href={usersHref(query, data.page - 1)} disabled={data.page <= 1}>
              Previous
            </PageLink>
            <PageLink href={usersHref(query, data.page + 1)} disabled={data.page >= totalPages}>
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
