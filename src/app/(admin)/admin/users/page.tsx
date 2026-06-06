import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AdminPlaceholder } from "@/components/admin";

/**
 * Metadata for the admin users route.
 */
export const metadata: Metadata = {
  title: "Users · Admin",
};

/**
 * Admin users section (placeholder until the user-management ticket).
 *
 * @returns The users page.
 */
export default function AdminUsersPage(): ReactElement {
  return <AdminPlaceholder title="Users" />;
}
