"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Avatar, Button, Input, Textarea, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { adminUpdateUser } from "@/server/actions/admin";
import type { AdminUserDetail as AdminUserDetailData, AdminUserRow } from "@/server/services";
import { StatCard } from "./StatCard";
import { UserRowActions } from "./UserRowActions";

/**
 * Props for the {@link AdminUserDetail} component.
 */
export type AdminUserDetailProps = {
  user: AdminUserDetailData;
  isSelf: boolean;
};

/**
 * Formats a date as a short, fixed-locale day.
 *
 * @param date - The date to format.
 * @returns The formatted day string.
 */
function day(date: Date): string {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * A small status pill used in the user header.
 *
 * @param props - The pill content and tone.
 * @param props.children - The label.
 * @param props.tone - The colour tone.
 * @returns The pill element.
 */
function Pill({ children, tone }: { children: string; tone: "accent" | "muted" }): ReactElement {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "accent" ? "bg-accent/10 text-accent" : "bg-surface text-ink-soft",
      )}
    >
      {children}
    </span>
  );
}

/**
 * Admin detail for a single user: a profile header with role/status and the
 * moderation actions, headline counts, an inline name/bio editor and recent
 * pins and comments, laid out as grouped cards.
 *
 * @param props - The user detail and whether it is the current admin.
 * @returns The user detail element.
 */
export function AdminUserDetail({ user, isSelf }: AdminUserDetailProps): ReactElement {
  const { show } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? "");
  const [error, setError] = useState<string | null>(null);

  const onSave = (): void => {
    setError(null);
    startTransition(async () => {
      try {
        await adminUpdateUser(user.id, name, bio);
        show({ title: "Profile updated" });
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Please try again.");
      }
    });
  };

  const row: AdminUserRow = {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
    verified: user.verified,
    disabled: user.disabled,
    createdAt: user.createdAt,
    pinCount: user.counts.pins,
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        ← Users
      </Link>

      <header className="mt-3 flex flex-col gap-4 rounded-2xl border border-line bg-bg p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar src={user.avatarUrl ?? undefined} name={user.name} size={72} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-extrabold text-ink">{user.name}</h1>
              <Pill tone={user.role === "ADMIN" ? "accent" : "muted"}>{user.role}</Pill>
              {user.verified ? <Pill tone="muted">Verified</Pill> : null}
              {user.disabled ? <Pill tone="accent">Banned</Pill> : null}
            </div>
            <div className="mt-1 truncate text-ink-soft">
              {user.username !== null ? `@${user.username} · ` : ""}
              {user.email}
            </div>
            <div className="text-sm text-ink-faint">Joined {day(user.createdAt)}</div>
          </div>
        </div>
        <div className="shrink-0">
          <UserRowActions user={row} isSelf={isSelf} redirectAfterDelete="/admin/users" />
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Pins" value={user.counts.pins} />
        <StatCard label="Comments" value={user.counts.comments} />
        <StatCard label="Boards" value={user.counts.boards} />
        <StatCard label="Followers" value={user.counts.followers} />
        <StatCard label="Following" value={user.counts.following} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-line bg-bg p-6 lg:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Profile</h2>
          <div className="mt-4 flex flex-col gap-4">
            <Input
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
            />
            <Textarea
              label="Bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              maxLength={300}
            />
            {error !== null ? (
              <p role="alert" className="text-sm text-accent">
                {error}
              </p>
            ) : null}
            <Button onClick={onSave} loading={pending} fullWidth>
              Save
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-bg p-6 lg:col-span-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-soft">
            Recent activity
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink">Pins</h3>
              {user.recentPins.length === 0 ? (
                <p className="text-sm text-ink-faint">No pins.</p>
              ) : (
                <ul className="-mx-2">
                  {user.recentPins.map((pin) => (
                    <li key={pin.id}>
                      <Link
                        href={`/admin/pins/${pin.id}`}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface"
                      >
                        <span className="truncate font-medium text-ink">{pin.title}</span>
                        <span className="shrink-0 text-ink-faint">{day(pin.createdAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-ink">Comments</h3>
              {user.recentComments.length === 0 ? (
                <p className="text-sm text-ink-faint">No comments.</p>
              ) : (
                <ul className="-mx-2 space-y-1">
                  {user.recentComments.map((comment) => (
                    <li key={comment.id} className="rounded-lg px-2 py-2 hover:bg-surface">
                      <p className="line-clamp-2 text-sm text-ink">{comment.body}</p>
                      <Link
                        href={`/admin/pins/${comment.pinId}`}
                        className="text-xs text-ink-soft hover:underline"
                      >
                        on {comment.pinTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
