import type { Metadata } from "next";
import type { ReactElement } from "react";
import { ModerationAdmin } from "@/components/admin";
import { getAdminComments, getAdminPins } from "@/server/services";

/**
 * Metadata for the admin moderation route.
 */
export const metadata: Metadata = {
  title: "Moderation · Admin",
};

/**
 * Admin moderation page: a tabbed view of pins and comments with search and
 * per-row removal. The active tab, search term and page come from the URL.
 *
 * @param props - Route props.
 * @param props.searchParams - The resolved URL search parameters.
 * @returns The moderation page.
 */
export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}): Promise<ReactElement> {
  const { tab, q, page } = await searchParams;
  const query = q ?? "";
  const parsedPage = Number.parseInt(page ?? "1", 10);
  const current = Number.isNaN(parsedPage) ? 1 : parsedPage;

  if (tab === "comments") {
    const comments = await getAdminComments(current);
    return <ModerationAdmin tab="comments" query="" comments={comments} />;
  }
  const pins = await getAdminPins(query, current);
  return <ModerationAdmin tab="pins" query={query} pins={pins} />;
}
