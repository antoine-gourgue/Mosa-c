import type { ReactElement, ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";

/**
 * Layout for the admin back office. It gates every nested route on the ADMIN
 * role (redirecting other visitors away) and renders the admin surface outside
 * the consumer navigation. The full admin shell is added in a later ticket.
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
  return <div className="min-h-dvh bg-bg">{children}</div>;
}
