import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { AdminUserDetail } from "@/components/admin";
import { getCurrentUser } from "@/lib/auth";
import { getAdminUserDetail } from "@/server/services";

/**
 * Metadata for the admin user detail route.
 */
export const metadata: Metadata = {
  title: "User · Admin",
};

/**
 * Admin user detail page: loads a single user's profile and activity, or a 404
 * when the user does not exist.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the user id.
 * @returns The user detail page.
 */
export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const [user, current] = await Promise.all([getAdminUserDetail(id), getCurrentUser()]);
  if (user === null) {
    notFound();
  }
  return <AdminUserDetail user={user} isSelf={current?.id === id} />;
}
