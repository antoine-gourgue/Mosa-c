import type { Metadata } from "next";
import type { ReactElement } from "react";
import { IconButton } from "@/components/ui";
import { BoardCollaborators, BoardTools } from "@/components/board";
import type { Collaborator } from "@/components/board";
import { PinFeed } from "@/components/pin";
import { SlidersIcon } from "@/icons";
import { getCurrentUser } from "@/lib/auth";
import { getSavedPins, getSuggestedCreators } from "@/server/services";

/**
 * Metadata for the board route.
 */
export const metadata: Metadata = {
  title: "Saved",
};

/**
 * Board route (Quick Saves): the centered header, collaborators, tools row,
 * pin count bar and the masonry grid of saved pins (or an empty state).
 *
 * @returns The board page.
 */
export default async function BoardsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  const [savedPins, others] = await Promise.all([
    user === null ? Promise.resolve([]) : getSavedPins(user.id),
    user === null ? Promise.resolve([]) : getSuggestedCreators(user.id, 2),
  ]);
  const count = savedPins.length;
  const savedIds = savedPins.map((pin) => pin.id);
  const collaborators: Collaborator[] = [
    { name: user?.name ?? "You", src: user?.image ?? null },
    ...others.map((creator) => ({ name: creator.name, src: creator.avatarUrl })),
  ];

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex flex-col items-center gap-6 py-8 text-center">
        <h1 className="text-[52px] font-extrabold leading-none text-ink">Quick Saves</h1>
        <BoardCollaborators collaborators={collaborators} />
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
      {count === 0 ? (
        <p className="mt-16 text-center text-ink-soft">
          No saved ideas yet — tap <b className="font-semibold text-ink">Save</b> on any pin to
          collect it here.
        </p>
      ) : (
        <div className="mt-6">
          <PinFeed pins={savedPins} savedIds={savedIds} min={230} />
        </div>
      )}
    </div>
  );
}
