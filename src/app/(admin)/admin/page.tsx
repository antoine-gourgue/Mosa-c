import type { Metadata } from "next";
import Link from "next/link";
import type { ReactElement } from "react";
import { DataTable, StatCard } from "@/components/admin";
import type { Column } from "@/components/admin";
import { getAdminOverview } from "@/server/services";
import type { AdminOverview } from "@/server/services";

/**
 * Metadata for the admin dashboard route.
 */
export const metadata: Metadata = {
  title: "Admin",
};

type RecentUser = AdminOverview["recentUsers"][number];
type RecentPin = AdminOverview["recentPins"][number];

/**
 * Formats a date as a short, locale-aware day.
 *
 * @param date - The date to format.
 * @returns The formatted day string.
 */
function day(date: Date): string {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Admin dashboard: headline counts and the most recent users and pins.
 *
 * @returns The dashboard page.
 */
export default async function AdminPage(): Promise<ReactElement> {
  const overview = await getAdminOverview();

  const userColumns: Column<RecentUser>[] = [
    {
      key: "user",
      header: "User",
      render: (user) => (
        <div>
          <Link href={`/admin/users/${user.id}`} className="font-semibold text-ink hover:underline">
            {user.name}
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
          className={
            user.role === "ADMIN"
              ? "rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent"
              : "rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft"
          }
        >
          {user.role}
        </span>
      ),
    },
    { key: "joined", header: "Joined", render: (user) => day(user.createdAt) },
  ];

  const pinColumns: Column<RecentPin>[] = [
    {
      key: "title",
      header: "Pin",
      render: (pin) => <span className="font-semibold">{pin.title}</span>,
    },
    { key: "creator", header: "Creator", render: (pin) => pin.creatorName },
    { key: "created", header: "Created", render: (pin) => day(pin.createdAt) },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-extrabold text-ink">Dashboard</h1>
      <p className="mt-1 text-ink-soft">An overview of activity across Mosaic.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Users" value={overview.counts.users} />
        <StatCard label="Pins" value={overview.counts.pins} />
        <StatCard label="Comments" value={overview.counts.comments} />
        <StatCard label="Boards" value={overview.counts.boards} />
        <StatCard label="Pending reports" value={overview.counts.pendingReports} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-ink">Recent users</h2>
        <DataTable
          columns={userColumns}
          rows={overview.recentUsers}
          getRowKey={(user) => user.id}
          empty="No users yet."
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-ink">Recent pins</h2>
        <DataTable
          columns={pinColumns}
          rows={overview.recentPins}
          getRowKey={(pin) => pin.id}
          empty="No pins yet."
        />
      </section>
    </div>
  );
}
