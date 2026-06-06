import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AdminPlaceholder } from "@/components/admin";

/**
 * Metadata for the admin categories route.
 */
export const metadata: Metadata = {
  title: "Categories · Admin",
};

/**
 * Admin categories section (placeholder until the category-management ticket).
 *
 * @returns The categories page.
 */
export default function AdminCategoriesPage(): ReactElement {
  return <AdminPlaceholder title="Categories" />;
}
