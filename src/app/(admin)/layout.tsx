import type { ReactElement, ReactNode } from "react";
import { AdminSidebar } from "@/components/admin";
import { requireAdmin } from "@/lib/auth";

/**
 * Layout for the admin back office. It gates every nested route on the ADMIN
 * role (redirecting other visitors away) and renders the admin shell — a
 * persistent sidebar beside the routed content — outside the consumer
 * navigation.
 *
 * @param props - Layout props.
 * @param props.children - The admin route content.
 * @returns The admin layout element.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  await requireAdmin();
  return (
    <div className="flex min-h-dvh bg-surface">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
