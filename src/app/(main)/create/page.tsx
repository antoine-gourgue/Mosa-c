import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CreatePin } from "@/components/create";
import { getCurrentUser } from "@/lib/auth";
import { getBoardsForUser } from "@/server/services";

/**
 * Metadata for the create route.
 */
export const metadata: Metadata = {
  title: "Create Pin",
};

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
  const boards = await getBoardsForUser(user.id);
  return <CreatePin boards={boards.map((board) => ({ id: board.id, name: board.name }))} />;
}
