import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined || databaseUrl === "") {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

type CreatorSeed = {
  key: string;
  name: string;
  avatarUrl: string;
  followersLabel: string;
};

type CategorySeed = {
  label: string;
  imageUrl: string;
};

type PinSeed = {
  ref: number;
  imageUrl: string;
  width: number;
  height: number;
  title: string;
  creator: string;
  category: string;
  description: string;
};

const creators: CreatorSeed[] = [
  { key: "mira", name: "Mira Solène", avatarUrl: "/images/wattped.png", followersLabel: "27m" },
  { key: "atlas", name: "Studio Atlas", avatarUrl: "/images/creator1.png", followersLabel: "8.5m" },
  { key: "bloom", name: "Bloom & Co", avatarUrl: "/images/creator2.png", followersLabel: "4.2m" },
  { key: "north", name: "Northlight", avatarUrl: "/images/creator3.png", followersLabel: "4.7m" },
];

const categories: CategorySeed[] = [
  { label: "Art", imageUrl: "/images/artflowers.png" },
  { label: "Photography", imageUrl: "/images/photography.png" },
  { label: "Auto", imageUrl: "/images/car.png" },
  { label: "Wallpaper", imageUrl: "/images/galaxy.png" },
  { label: "Animals", imageUrl: "/images/fox.png" },
  { label: "Astronomy", imageUrl: "/images/astronomy.png" },
  { label: "Design", imageUrl: "/images/design.png" },
  { label: "Food", imageUrl: "/images/oranges.png" },
];

const pins: PinSeed[] = [
  {
    ref: 1,
    imageUrl: "/images/orchid.png",
    width: 344,
    height: 370,
    title: "All Over You — orchid study",
    creator: "mira",
    category: "Art",
    description: "Saturated florals from the All Over You series. Warm tones, soft focus.",
  },
  {
    ref: 13,
    imageUrl: "/images/bird.png",
    width: 750,
    height: 1200,
    title: "Dove on pink steps",
    creator: "north",
    category: "Photography",
    description: "A single dove resting on minimal pink architecture against a pale sky.",
  },
  {
    ref: 2,
    imageUrl: "/images/car.png",
    width: 352,
    height: 464,
    title: "Vintage roadster, top-down",
    creator: "atlas",
    category: "Auto",
    description: "Classic red convertible shot from above on open asphalt.",
  },
  {
    ref: 5,
    imageUrl: "/images/galaxy.png",
    width: 352,
    height: 176,
    title: "Galaxy wallpaper",
    creator: "north",
    category: "Wallpaper",
    description: "Deep purple nebula — phone & desktop wallpaper.",
  },
  {
    ref: 6,
    imageUrl: "/images/pug.png",
    width: 352,
    height: 176,
    title: "Pug in round glasses",
    creator: "bloom",
    category: "Animals",
    description: "The most studious pug you'll meet today.",
  },
  {
    ref: 14,
    imageUrl: "/images/starburst.png",
    width: 336,
    height: 464,
    title: "Star burst, long exposure",
    creator: "atlas",
    category: "Astronomy",
    description: "Radial star trails captured over a clear night sky.",
  },
  {
    ref: 8,
    imageUrl: "/images/design.png",
    width: 352,
    height: 170,
    title: "Studio desk setup",
    creator: "atlas",
    category: "Design",
    description: "Minimal workspace, plants, and a wide display.",
  },
  {
    ref: 11,
    imageUrl: "/images/artflowers.png",
    width: 352,
    height: 172,
    title: "Dutch florals",
    creator: "bloom",
    category: "Art",
    description: "Old-master still life with roses and poppies.",
  },
  {
    ref: 7,
    imageUrl: "/images/astronomy.png",
    width: 352,
    height: 170,
    title: "Deep sky",
    creator: "north",
    category: "Astronomy",
    description: "The Milky Way arcing over the horizon.",
  },
  {
    ref: 15,
    imageUrl: "/images/andromeda.png",
    width: 352,
    height: 504,
    title: "Andromeda galaxy",
    creator: "atlas",
    category: "Astronomy",
    description: "Our nearest spiral neighbour, 2.5 million light-years away.",
  },
  {
    ref: 9,
    imageUrl: "/images/photography.png",
    width: 352,
    height: 172,
    title: "Boardwalk at dusk",
    creator: "north",
    category: "Photography",
    description: "A lone figure on a wooden pier under a heavy sky.",
  },
  {
    ref: 10,
    imageUrl: "/images/fox.png",
    width: 352,
    height: 172,
    title: "Wild fox",
    creator: "bloom",
    category: "Animals",
    description: "Red fox standing alert in blue evening light.",
  },
  {
    ref: 4,
    imageUrl: "/images/oranges.png",
    width: 352,
    height: 184,
    title: "Citrus studies",
    creator: "bloom",
    category: "Food",
    description: "Cross-sections of fresh oranges, top-down.",
  },
  {
    ref: 3,
    imageUrl: "/images/sunset.png",
    width: 352,
    height: 160,
    title: "Golden hour ridge",
    creator: "north",
    category: "Photography",
    description: "Sun dipping below a dark treeline.",
  },
  {
    ref: 12,
    imageUrl: "/images/orchidwide.png",
    width: 640,
    height: 300,
    title: "Bloom series — wide",
    creator: "mira",
    category: "Art",
    description: "All Over You with the orchid motif, landscape crop.",
  },
];

/**
 * Converts a label into a URL-friendly slug.
 *
 * @param label - The human-readable label.
 * @returns The kebab-case slug.
 */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Seeds creators, categories, pins and a demo user with a default board, a few
 * saves and a follow. Idempotent through upserts keyed by stable identifiers.
 *
 * @returns A promise that resolves when seeding completes.
 */
async function main(): Promise<void> {
  for (const category of categories) {
    const slug = slugify(category.label);
    await prisma.category.upsert({
      where: { slug },
      update: { label: category.label, imageUrl: category.imageUrl },
      create: { slug, label: category.label, imageUrl: category.imageUrl },
    });
  }

  for (const creator of creators) {
    await prisma.user.upsert({
      where: { email: `${creator.key}@mosaic.app` },
      update: {
        name: creator.name,
        username: creator.key,
        avatarUrl: creator.avatarUrl,
        followersLabel: creator.followersLabel,
        verified: true,
      },
      create: {
        id: `user_${creator.key}`,
        email: `${creator.key}@mosaic.app`,
        name: creator.name,
        username: creator.key,
        avatarUrl: creator.avatarUrl,
        followersLabel: creator.followersLabel,
        verified: true,
      },
    });
  }

  const demoPasswordHash = await hash("password123", 12);
  await prisma.user.upsert({
    where: { email: "demo@mosaic.app" },
    update: { name: "You", username: "you", passwordHash: demoPasswordHash },
    create: {
      id: "user_demo",
      email: "demo@mosaic.app",
      name: "You",
      username: "you",
      avatarUrl: "/images/creator1.png",
      passwordHash: demoPasswordHash,
    },
  });

  await prisma.board.upsert({
    where: { id: "board_demo_quick" },
    update: { name: "Quick Saves" },
    create: {
      id: "board_demo_quick",
      name: "Quick Saves",
      isDefault: true,
      owner: { connect: { id: "user_demo" } },
    },
  });

  for (const pin of pins) {
    await prisma.pin.upsert({
      where: { id: `pin_${pin.ref}` },
      update: {
        title: pin.title,
        description: pin.description,
        imageUrl: pin.imageUrl,
        width: pin.width,
        height: pin.height,
      },
      create: {
        id: `pin_${pin.ref}`,
        title: pin.title,
        description: pin.description,
        imageUrl: pin.imageUrl,
        width: pin.width,
        height: pin.height,
        creator: { connect: { id: `user_${pin.creator}` } },
        category: { connect: { slug: slugify(pin.category) } },
      },
    });
  }

  for (const ref of [14, 15]) {
    await prisma.save.upsert({
      where: { userId_pinId: { userId: "user_demo", pinId: `pin_${ref}` } },
      update: {},
      create: { userId: "user_demo", pinId: `pin_${ref}` },
    });
  }

  await prisma.follow.upsert({
    where: { followerId_creatorId: { followerId: "user_demo", creatorId: "user_mira" } },
    update: {},
    create: { followerId: "user_demo", creatorId: "user_mira" },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.stdout.write("Seed complete.\n");
  })
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    process.stderr.write(`Seed failed: ${String(error)}\n`);
    process.exitCode = 1;
  });
