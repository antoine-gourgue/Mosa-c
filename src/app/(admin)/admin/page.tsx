import type { Metadata } from "next";
import type { ReactElement } from "react";

/**
 * Metadata for the admin landing route.
 */
export const metadata: Metadata = {
  title: "Admin",
};

/**
 * Admin landing page. This is a placeholder for the foundation ticket; the
 * dashboard and the rest of the back office are built in later tickets.
 *
 * @returns The admin landing page.
 */
export default function AdminPage(): ReactElement {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-extrabold text-ink">Admin</h1>
      <p className="mt-2 text-ink-soft">
        Back office foundation is in place. The dashboard and tools are coming next.
      </p>
    </div>
  );
}
