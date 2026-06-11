import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createMistralProvider } from "../src/lib/ai/mistral";

/**
 * Backfills semantic embeddings for pins that don't have one yet. Reuses each
 * pin's AI alt text when present and only describes the image (the costly vision
 * call) when it is missing — persisting that description for next time. Requests
 * are throttled by the provider to respect the free-tier rate limit, so this can
 * run unattended. Re-runnable: it only touches pins still missing an embedding.
 *
 * Usage: `npm run ai:backfill`
 */
async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl === "") {
    throw new Error("DATABASE_URL is required.");
  }
  const apiKey = process.env.MISTRAL_API_KEY;
  if (apiKey === undefined || apiKey === "") {
    process.stdout.write("MISTRAL_API_KEY is not set — nothing to backfill.\n");
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const ai = createMistralProvider({ apiKey });

  const pins = await prisma.pin.findMany({
    where: { embedding: { is: null } },
    select: {
      id: true,
      title: true,
      description: true,
      altText: true,
      imageUrl: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  process.stdout.write(`Backfilling embeddings for ${pins.length} pin(s)…\n`);

  let done = 0;
  for (const pin of pins) {
    let altText = pin.altText;
    if (altText === null) {
      altText = await ai.describeImage(pin.imageUrl);
      if (altText !== null) {
        await prisma.pin.update({ where: { id: pin.id }, data: { altText } });
      }
    }
    const text = [altText, pin.title, pin.description, pin.tags.map((t) => t.tag.name).join(", ")]
      .filter((part): part is string => typeof part === "string" && part.trim() !== "")
      .join(". ")
      .slice(0, 2000);
    if (text === "") {
      continue;
    }
    const vector = await ai.embed(text);
    if (vector === null) {
      continue;
    }
    await prisma.pinEmbedding.upsert({
      where: { pinId: pin.id },
      update: { vector },
      create: { pinId: pin.id, vector },
    });
    done += 1;
  }

  process.stdout.write(`Done: embedded ${done}/${pins.length} pin(s).\n`);
  await prisma.$disconnect();
}

void main();
