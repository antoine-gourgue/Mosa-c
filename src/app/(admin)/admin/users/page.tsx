import type { Metadata } from "next";
import type { ReactElement } from "react";
import { UsersAdmin } from "@/components/admin";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUsers } from "@/server/services";

/**
 * Metadata for the admin users route.
 */
export const metadata: Metadata = {
  title: "Users · Admin",
};

/**
 * Admin users management page: reads the search term and page from the URL,
 * loads the matching users and renders the management table.
 *
 * @param props - Route props.
 * @param props.searchParams - The resolved URL search parameters.
 * @returns The users page.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}): Promise<ReactElement> {
  const { q, page } = await searchParams;
  const query = q ?? "";
  const parsedPage = Number.parseInt(page ?? "1", 10);
  const [data, user] = await Promise.all([
    getAdminUsers(query, Number.isNaN(parsedPage) ? 1 : parsedPage),
    getCurrentUser(),
  ]);
  return <UsersAdmin data={data} query={query} currentUserId={user?.id ?? ""} />;
}
