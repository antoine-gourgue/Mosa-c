import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AdminPlaceholder } from "@/components/admin";

/**
 * Metadata for the admin reports route.
 */
export const metadata: Metadata = {
  title: "Reports · Admin",
};

/**
 * Admin reports section (placeholder until the reports queue ticket).
 *
 * @returns The reports page.
 */
export default function AdminReportsPage(): ReactElement {
  return <AdminPlaceholder title="Reports" />;
}
