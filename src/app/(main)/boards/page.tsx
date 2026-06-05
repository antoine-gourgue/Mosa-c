import type { Metadata } from "next";
import type { ReactElement } from "react";
import { IconButton } from "@/components/ui";
import { BoardTools } from "@/components/board";
import { SlidersIcon } from "@/icons";
import { getCurrentUser } from "@/lib/auth";
import { getSavedPinIds } from "@/server/services";

/**
 * Metadata for the board route.
 */
export const metadata: Metadata = {
  title: "Saved",
};

/**
 * Board route (Quick Saves): the centered header, tools row and pin count bar.
 * The collaborators and saved pins grid are added in later tickets.
 *
 * @returns The board page.
 */
export default async function BoardsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  const savedIds = user === null ? [] : await getSavedPinIds(user.id);
  const count = savedIds.length;

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex flex-col items-center gap-6 py-8 text-center">
        <h1 className="text-[52px] font-extrabold leading-none text-ink">Quick Saves</h1>
        <BoardTools />
      </header>
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="font-semibold text-ink">
          {count} {count === 1 ? "Pin" : "Pins"}
        </span>
        <IconButton label="Filter">
          <SlidersIcon />
        </IconButton>
      </div>
    </div>
  );
}
