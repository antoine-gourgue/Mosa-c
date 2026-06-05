import { prisma } from "@/lib/prisma";
import type { Category } from "@/types/domain";
import { toCategory } from "./mappers";

/**
 * Fetches all categories for the discovery grid, alphabetically.
 *
 * @returns The list of categories.
 */
export async function getCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { label: "asc" } });
  return rows.map(toCategory);
}
