import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BoardsView } from "@/components/board";
import { getCurrentUser } from "@/lib/auth";
import { getUserBoardsWithCovers } from "@/server/services";

/**
 * Metadata for the boards route.
 */
export const metadata: Metadata = {
  title: "Your boards",
};

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
  const boards = await getUserBoardsWithCovers(user.id);

  return <BoardsView boards={boards} />;
}
