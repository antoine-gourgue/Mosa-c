import { prisma } from "@/lib/prisma";

/**
 * Returns the ids of users whose content must be hidden from the viewer: users
 * the viewer has blocked, and users who have blocked the viewer. Blocking is
 * symmetric for visibility — neither party sees the other's pins, comments or
 * profile. Empty for a signed-out viewer.
 *
 * @param viewerId - The current viewer id, or null when signed out.
 * @returns The user ids to hide from the viewer.
 */
export async function getHiddenUserIds(viewerId: string | null): Promise<string[]> {
  if (viewerId === null) {
    return [];
  }
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const row of rows) {
    ids.add(row.blockerId === viewerId ? row.blockedId : row.blockerId);
  }
  return [...ids];
}

/**
 * The block relationship between the viewer and another user, in both
 * directions.
 */
export type BlockState = {
  blockedByViewer: boolean;
  blocksViewer: boolean;
};

/**
 * Resolves whether the viewer has blocked the other user and whether the other
 * user has blocked the viewer. Both false for a signed-out viewer or for the
 * viewer's own profile.
 *
 * @param viewerId - The current viewer id, or null when signed out.
 * @param otherId - The other user's id.
 * @returns The block relationship between the two users.
 */
export async function getBlockState(viewerId: string | null, otherId: string): Promise<BlockState> {
  if (viewerId === null || viewerId === otherId) {
    return { blockedByViewer: false, blocksViewer: false };
  }
  const rows = await prisma.block.findMany({
    where: {
      OR: [
        { blockerId: viewerId, blockedId: otherId },
        { blockerId: otherId, blockedId: viewerId },
      ],
    },
    select: { blockerId: true },
  });
  return {
    blockedByViewer: rows.some((row) => row.blockerId === viewerId),
    blocksViewer: rows.some((row) => row.blockerId === otherId),
  };
}
