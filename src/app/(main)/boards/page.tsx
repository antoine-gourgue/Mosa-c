import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { BoardsView } from "@/components/board";
import { getCurrentUser } from "@/lib/auth";
import { getFollowedBoardsWithCovers, getUserBoardsWithCovers } from "@/server/services";

/**
 * Metadata for the boards route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("boards"),
  };
}

/**
 * Boards route: lists every board owned by the current user as cover cards,
 * including the default Quick Saves board, each linking to its detail.
 *
 * @returns The boards page.
 */
export default async function BoardsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const [boards, followedBoards] = await Promise.all([
    getUserBoardsWithCovers(user.id),
    getFollowedBoardsWithCovers(user.id),
  ]);

  return <BoardsView boards={boards} followedBoards={followedBoards} />;
}
