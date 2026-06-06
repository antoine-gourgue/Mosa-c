import { prisma } from "@/lib/prisma";

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
