import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CategoriesAdmin } from "@/components/admin";
import { getAdminCategories } from "@/server/services";

/**
 * Metadata for the admin categories route.
 */
export const metadata: Metadata = {
  title: "Categories · Admin",
};

/**
 * Admin categories management page: loads every category and renders the
 * management table with create, edit and delete.
 *
 * @returns The categories page.
 */
export default async function AdminCategoriesPage(): Promise<ReactElement> {
  const categories = await getAdminCategories();
  return <CategoriesAdmin categories={categories} />;
}
