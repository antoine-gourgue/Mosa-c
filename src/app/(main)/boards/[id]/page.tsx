import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { BoardHeader } from "@/components/board";
import { PinFeed } from "@/components/pin";
import { getCurrentUser } from "@/lib/auth";
import { getBoardWithPins, getLikedPinIds, getSavedPinIds } from "@/server/services";

/**
 * Builds the board page metadata.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params.
 * @returns The page metadata.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const board = await getBoardWithPins(id);
  return { title: board?.name ?? "Board" };
}

/**
 * Board (collection) detail route showing the board header and its pins.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params with the board id.
 * @returns The board page.
 */
export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const board = await getBoardWithPins(id, viewer?.id ?? null);
  if (board === null) {
    notFound();
  }
  const [savedIds, likedIds] =
    viewer === null
      ? [[], []]
      : await Promise.all([getSavedPinIds(viewer.id), getLikedPinIds(viewer.id)]);
  const count = board.pins.length;

  return (
    <div className="mx-auto max-w-[1180px]">
      <BoardHeader board={board} />
      {count === 0 ? (
        <p className="py-16 text-center text-ink-soft">This board is empty.</p>
      ) : (
        <PinFeed
          pins={board.pins}
          savedIds={savedIds}
          likedIds={likedIds}
          min={230}
          viewerId={viewer?.id ?? null}
        />
      )}
    </div>
  );
}
