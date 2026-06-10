"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import type { AdminReportRow, AdminReportsPage } from "@/server/services";
import { DataTable } from "./DataTable";
import type { Column } from "./DataTable";
import { ReportRowActions } from "./ReportRowActions";

/**
 * Props for the {@link ReportsAdmin} component.
 */
export type ReportsAdminProps = {
  data: AdminReportsPage;
};

/**
 * Builds the reports queue URL for a page.
 *
 * @param page - The 1-based page number.
 * @returns The relative URL.
 */
function reportsHref(page: number): string {
  return page > 1 ? `/admin/reports?page=${page}` : "/admin/reports";
}

const TARGET_LABEL = { PIN: "Pin", COMMENT: "Comment", USER: "Profile", UNKNOWN: "—" } as const;

/**
 * Renders the reported entity behind a report as a labelled link to its admin
 * detail, or plain text when the target is no longer available.
 *
 * @param target - The report's discriminated target.
 * @returns The target cell content.
 */
function TargetCell({ target }: { target: AdminReportRow["target"] }): ReactElement {
  const tag = (
    <span className="mr-2 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-ink-soft">
      {TARGET_LABEL[target.type]}
    </span>
  );
  if (target.type === "PIN") {
    return (
      <span className="flex items-center">
        {tag}
        <Link
          href={`/admin/pins/${target.pinId}`}
          className="font-semibold text-ink hover:underline"
        >
          {target.title}
        </Link>
      </span>
    );
  }
  if (target.type === "COMMENT") {
    return (
      <span className="flex items-center">
        {tag}
        <Link href={`/admin/pins/${target.pinId}`} className="text-ink-soft hover:underline">
          “{target.body.length > 80 ? `${target.body.slice(0, 80)}…` : target.body}”
        </Link>
      </span>
    );
  }
  if (target.type === "USER") {
    return (
      <span className="flex items-center">
        {tag}
        <Link
          href={`/admin/users/${target.userId}`}
          className="font-semibold text-ink hover:underline"
        >
          {target.username !== null ? `@${target.username}` : target.name}
        </Link>
      </span>
    );
  }
  return <span className="text-ink-soft">{TARGET_LABEL.UNKNOWN}</span>;
}

const COLUMNS: Column<AdminReportRow>[] = [
  {
    key: "target",
    header: "Reported",
    render: (report) => <TargetCell target={report.target} />,
  },
  {
    key: "reporter",
    header: "Reported by",
    render: (report) => (
      <div>
        <div className="text-ink">{report.reporterName}</div>
        <div className="text-ink-soft">{report.reporterEmail}</div>
      </div>
    ),
  },
  {
    key: "reason",
    header: "Reason",
    render: (report) => <span className="text-ink-soft">{report.reason ?? "No reason given"}</span>,
  },
  {
    key: "date",
    header: "Date",
    render: (report) =>
      report.createdAt.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
  },
  {
    key: "actions",
    header: "",
    className: "text-right",
    render: (report) => <ReportRowActions reportId={report.id} target={report.target} />,
  },
];

/**
 * Admin reports queue: a paginated table of pending reports with dismiss and
 * resolve actions per row.
 *
 * @param props - The page of pending reports.
 * @returns The reports queue element.
 */
export function ReportsAdmin({ data }: ReportsAdminProps): ReactElement {
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl font-extrabold text-ink">Reports</h1>
      <p className="mt-1 text-ink-soft">{data.total.toLocaleString()} pending</p>

      <div className="mt-5">
        <DataTable
          columns={COLUMNS}
          rows={data.rows}
          getRowKey={(report) => report.id}
          empty="No pending reports — all clear."
        />
      </div>

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between text-sm text-ink-soft">
          <span>
            Page {data.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {data.page > 1 ? (
              <Link
                href={reportsHref(data.page - 1)}
                className="rounded-full px-4 py-2 font-semibold text-ink transition-colors hover:bg-surface"
              >
                Previous
              </Link>
            ) : null}
            {data.page < totalPages ? (
              <Link
                href={reportsHref(data.page + 1)}
                className="rounded-full px-4 py-2 font-semibold text-ink transition-colors hover:bg-surface"
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
