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

const COLUMNS: Column<AdminReportRow>[] = [
  {
    key: "pin",
    header: "Pin",
    render: (report) => (
      <Link href={`/pin/${report.pinId}`} className="font-semibold text-ink hover:underline">
        {report.pinTitle}
      </Link>
    ),
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
    key: "reported",
    header: "Reported",
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
    render: (report) => <ReportRowActions reportId={report.id} pinTitle={report.pinTitle} />,
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
