"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Avatar, Button, Input, Textarea, useToast } from "@/components/ui";
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
 * Admin detail for a single user: profile header with role/status, the moderation
 * actions, headline counts, an inline name/bio editor and recent pins and
 * comments.
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
      <Link href="/admin/users" className="text-sm font-semibold text-ink-soft hover:underline">
        ← Users
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl ?? undefined} name={user.name} size={64} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-ink">{user.name}</h1>
              <span
                className={
                  user.role === "ADMIN"
                    ? "rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent"
                    : "rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft"
                }
              >
                {user.role}
              </span>
              {user.verified ? (
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft">
                  Verified
                </span>
              ) : null}
              {user.disabled ? (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  Banned
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-ink-soft">
              {user.username !== null ? `@${user.username} · ` : ""}
              {user.email}
            </div>
            <div className="text-sm text-ink-faint">Joined {day(user.createdAt)}</div>
          </div>
        </div>
        <UserRowActions user={row} isSelf={isSelf} redirectAfterDelete="/admin/users" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Pins" value={user.counts.pins} />
        <StatCard label="Comments" value={user.counts.comments} />
        <StatCard label="Boards" value={user.counts.boards} />
        <StatCard label="Followers" value={user.counts.followers} />
        <StatCard label="Following" value={user.counts.following} />
      </div>

      <section className="mt-8 max-w-lg">
        <h2 className="mb-3 text-lg font-bold text-ink">Edit profile</h2>
        <div className="flex flex-col gap-4">
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
            rows={3}
            maxLength={300}
          />
          {error !== null ? (
            <p role="alert" className="text-sm text-accent">
              {error}
            </p>
          ) : null}
          <div>
            <Button onClick={onSave} loading={pending}>
              Save
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold text-ink">Recent pins</h2>
          {user.recentPins.length === 0 ? (
            <p className="text-sm text-ink-soft">No pins.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {user.recentPins.map((pin) => (
                <li key={pin.id}>
                  <Link
                    href={`/pin/${pin.id}`}
                    className="flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-3 hover:bg-surface"
                  >
                    <span className="font-semibold text-ink">{pin.title}</span>
                    <span className="text-sm text-ink-soft">{day(pin.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold text-ink">Recent comments</h2>
          {user.recentComments.length === 0 ? (
            <p className="text-sm text-ink-soft">No comments.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {user.recentComments.map((comment) => (
                <li
                  key={comment.id}
                  className="rounded-xl border border-line bg-bg px-4 py-3 text-sm"
                >
                  <p className="line-clamp-2 text-ink">{comment.body}</p>
                  <Link href={`/pin/${comment.pinId}`} className="text-ink-soft hover:underline">
                    on {comment.pinTitle}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
