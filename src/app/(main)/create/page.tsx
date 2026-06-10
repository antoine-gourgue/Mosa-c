import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { CreatePin } from "@/components/create";
import { getCurrentUser } from "@/lib/auth";
import { getUserBoardsWithCovers } from "@/server/services";

/**
 * Metadata for the create route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("create"),
    robots: { index: false },
  };
}

/**
 * Create Pin route, providing the user's boards for the board selector.
 *
 * @returns The create page.
 */
export default async function CreatePage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const boards = await getUserBoardsWithCovers(user.id);
  return (
    <CreatePin
      boards={boards.map((board) => ({
        id: board.id,
        name: board.name,
        coverUrl: board.coverUrls[0] ?? null,
      }))}
    />
  );
}
