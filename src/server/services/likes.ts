import { prisma } from "@/lib/prisma";

/**
 * Fetches the ids of pins liked by a user, for highlighting the like state
 * across a grid of cards.
 *
 * @param userId - The user id.
 * @returns The liked pin ids.
 */
export async function getLikedPinIds(userId: string): Promise<string[]> {
  const rows = await prisma.like.findMany({ where: { userId }, select: { pinId: true } });
  return rows.map((row) => row.pinId);
}

/**
 * Fetches the like count for a pin and whether a viewer has liked it.
 *
 * @param pinId - The pin id.
 * @param viewerId - The viewer's user id, or null when signed out.
 * @returns The like count and the viewer's liked state.
 */
export async function getLikeState(
  pinId: string,
  viewerId: string | null,
): Promise<{ count: number; liked: boolean }> {
  const [count, liked] = await Promise.all([
    prisma.like.count({ where: { pinId } }),
    viewerId === null
      ? Promise.resolve(false)
      : prisma.like
          .findUnique({ where: { userId_pinId: { userId: viewerId, pinId } } })
          .then((row) => row !== null),
  ]);
  return { count, liked };
}
