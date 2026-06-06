import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BoardsGrid } from "@/components/board";
import { getCurrentUser } from "@/lib/auth";
import { getCreatorById, getUserBoardsWithCovers } from "@/server/services";

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
  const profile = await getCreatorById(user.id);
  const boards = await getUserBoardsWithCovers(user.id, profile?.username ?? null);

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex items-center justify-between py-8">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Your boards</h1>
      </header>
      <BoardsGrid boards={boards} emptyMessage="No boards yet — save a pin to start one." />
    </div>
  );
}
