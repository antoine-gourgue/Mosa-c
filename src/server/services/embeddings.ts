import { aiAvailable, describeImage, embed } from "@/lib/ai";
import { cosineSimilarity } from "@/lib/cosine";
import { prisma } from "@/lib/prisma";

/**
 * The most recent pin vectors scanned for a nearest-neighbour query. Bounds the
 * in-memory cosine scan; ample for the app's scale, and the cut-off to revisit
 * (with pgvector) only once vectors number in the tens of thousands.
 */
const CANDIDATE_LIMIT = 1000;

/**
 * The text fields that feed a pin's embedding, distilled from its AI alt text,
 * title, description and tags.
 */
export type PinEmbeddingText = {
  altText?: string | null;
  title: string;
  description?: string | null;
  tags: string[];
};

/**
 * Builds the text embedded for a pin from its available fields, in priority
 * order (the AI alt text carries the visual meaning), capped for the embedder.
 *
 * @param parts - The pin's text fields.
 * @returns The combined embedding text (possibly empty).
 */
export function buildEmbeddingText(parts: PinEmbeddingText): string {
  return [parts.altText, parts.title, parts.description, parts.tags.join(", ")]
    .filter((part): part is string => typeof part === "string" && part.trim() !== "")
    .join(". ")
    .slice(0, 2000);
}

/**
 * Generates and stores a pin's embedding from its text. When the pin has no AI
 * alt text yet and `describeIfNeeded` is set (the backfill path), the image is
 * described first and the alt text persisted — so the costly vision call happens
 * at most once per pin. No-ops (returns false) when AI is unconfigured, the pin
 * is gone, there is no text, or the embedding call fails.
 *
 * @param pinId - The pin to embed.
 * @param options - Whether to describe the image when alt text is missing.
 * @returns Whether an embedding was stored.
 */
export async function embedPin(
  pinId: string,
  options: { describeIfNeeded?: boolean } = {},
): Promise<boolean> {
  if (!aiAvailable()) {
    return false;
  }
  const pin = await prisma.pin.findUnique({
    where: { id: pinId },
    select: {
      title: true,
      description: true,
      altText: true,
      imageUrl: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
  });
  if (pin === null) {
    return false;
  }
  let altText = pin.altText;
  if (altText === null && options.describeIfNeeded === true) {
    altText = await describeImage(pin.imageUrl);
    if (altText !== null) {
      await prisma.pin.update({ where: { id: pinId }, data: { altText } });
    }
  }
  const text = buildEmbeddingText({
    altText,
    title: pin.title,
    description: pin.description,
    tags: pin.tags.map((pinTag) => pinTag.tag.name),
  });
  if (text === "") {
    return false;
  }
  const vector = await embed(text);
  if (vector === null) {
    return false;
  }
  await prisma.pinEmbedding.upsert({
    where: { pinId },
    update: { vector },
    create: { pinId, vector },
  });
  return true;
}

/**
 * Fetches a pin's stored embedding vector, or null when it has none.
 *
 * @param pinId - The pin id.
 * @returns The vector, or null.
 */
export async function getPinVector(pinId: string): Promise<number[] | null> {
  const row = await prisma.pinEmbedding.findUnique({
    where: { pinId },
    select: { vector: true },
  });
  return row?.vector ?? null;
}

/**
 * Embeds a free-text query for semantic search, or null when AI is unavailable.
 *
 * @param query - The search query.
 * @returns The query vector, or null.
 */
export async function embedQuery(query: string): Promise<number[] | null> {
  if (!aiAvailable()) {
    return null;
  }
  return embed(query);
}

/**
 * Ranks the most semantically similar pins to a vector by cosine similarity,
 * scanning a bounded window of recent vectors. Excludes a pin and a set of
 * hidden creators (blocked / private non-followed), and any non-positive match.
 *
 * @param vector - The query/pin vector to compare against.
 * @param options - Exclusions and the result size.
 * @returns The matching pin ids, best first.
 */
export async function findSimilarPinIds(
  vector: number[],
  options: { excludePinId?: string; excludeUserIds: string[]; limit: number },
): Promise<string[]> {
  const rows = await prisma.pinEmbedding.findMany({
    where: {
      ...(options.excludePinId !== undefined ? { pinId: { not: options.excludePinId } } : {}),
      ...(options.excludeUserIds.length > 0
        ? { pin: { creatorId: { notIn: options.excludeUserIds } } }
        : {}),
    },
    select: { pinId: true, vector: true },
    orderBy: { createdAt: "desc" },
    take: CANDIDATE_LIMIT,
  });
  return rows
    .map((row) => ({ pinId: row.pinId, score: cosineSimilarity(vector, row.vector) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit)
    .map((row) => row.pinId);
}
