import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ReportsAdmin } from "@/components/admin";
import { getAdminReports } from "@/server/services";

/**
 * Metadata for the admin reports route.
 */
export const metadata: Metadata = {
  title: "Reports · Admin",
};

/**
 * Admin reports queue page: reads the page from the URL and loads the pending
 * reports to triage.
 *
 * @param props - Route props.
 * @param props.searchParams - The resolved URL search parameters.
 * @returns The reports page.
 */
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<ReactElement> {
  const { page } = await searchParams;
  const parsedPage = Number.parseInt(page ?? "1", 10);
  const data = await getAdminReports(Number.isNaN(parsedPage) ? 1 : parsedPage);
  return <ReportsAdmin data={data} />;
}
