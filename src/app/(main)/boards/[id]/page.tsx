import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Avatar } from "@/components/ui";
import { PinFeed } from "@/components/pin";
import { getCurrentUser } from "@/lib/auth";
import { getBoardWithPins, getSavedPinIds } from "@/server/services";

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
  const savedIds = viewer === null ? [] : await getSavedPinIds(viewer.id);
  const count = board.pins.length;

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="flex flex-col items-center gap-3 py-8 text-center">
        <h1 className="text-4xl font-extrabold text-ink sm:text-5xl">{board.name}</h1>
        <Link
          href={board.owner.username !== null ? `/u/${board.owner.username}` : "#"}
          className="flex items-center gap-2"
        >
          <Avatar src={board.owner.avatarUrl ?? undefined} name={board.owner.name} size={28} />
          <span className="text-sm text-ink-soft">{board.owner.name}</span>
        </Link>
        <p className="text-sm text-ink-soft">
          {count} {count === 1 ? "Pin" : "Pins"}
        </p>
      </header>
      {count === 0 ? (
        <p className="py-16 text-center text-ink-soft">This board is empty.</p>
      ) : (
        <PinFeed pins={board.pins} savedIds={savedIds} min={230} viewerId={viewer?.id ?? null} />
      )}
    </div>
  );
}
