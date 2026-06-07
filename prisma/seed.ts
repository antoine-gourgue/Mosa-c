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

/**
 * Builds a cropped Unsplash delivery URL at the given dimensions so the stored
 * width and height always match the served image.
 *
 * @param id - The Unsplash photo id (the part after `photo-`).
 * @param width - The desired crop width in pixels.
 * @param height - The desired crop height in pixels.
 * @returns The fully-qualified image URL.
 */
function unsplash(id: string, width: number, height: number): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

const creators: CreatorSeed[] = [
  { key: "mira", name: "Mira Solène", avatarUrl: "/images/wattped.png", followersLabel: "27m" },
  { key: "atlas", name: "Studio Atlas", avatarUrl: "/images/creator1.png", followersLabel: "8.5m" },
  { key: "bloom", name: "Bloom & Co", avatarUrl: "/images/creator2.png", followersLabel: "4.2m" },
  { key: "north", name: "Northlight", avatarUrl: "/images/creator3.png", followersLabel: "4.7m" },
];

const categories: CategorySeed[] = [
  { label: "Travel", imageUrl: unsplash("1501785888041-af3ef285b470", 500, 500) },
  { label: "Mountains", imageUrl: unsplash("1506905925346-21bda4d32df4", 500, 500) },
  { label: "Nature", imageUrl: unsplash("1441974231531-c6227db76b6e", 500, 500) },
  { label: "Food", imageUrl: unsplash("1504674900247-0877df9cc836", 500, 500) },
  { label: "Animals", imageUrl: unsplash("1518791841217-8f162f1e1131", 500, 500) },
  { label: "City", imageUrl: unsplash("1480714378408-67cf0d13bc1b", 500, 500) },
];

const pins: PinSeed[] = [
  {
    ref: 1,
    imageUrl: unsplash("1501785888041-af3ef285b470", 600, 460),
    width: 600,
    height: 460,
    title: "Lago di Braies, Dolomites",
    creator: "atlas",
    category: "Travel",
    description: "Turquoise water and wooden rowboats beneath the Dolomite cliffs.",
  },
  {
    ref: 2,
    imageUrl: unsplash("1469474968028-56623f02e42e", 600, 520),
    width: 600,
    height: 520,
    title: "Above the green valley",
    creator: "north",
    category: "Nature",
    description: "A lone hiker on a ridge above mist-filled, forested hills.",
  },
  {
    ref: 3,
    imageUrl: unsplash("1470770841072-f978cf4d019e", 600, 500),
    width: 600,
    height: 500,
    title: "Lakeside cabin in the Alps",
    creator: "atlas",
    category: "Travel",
    description: "A wooden boathouse on a still mountain lake at first light.",
  },
  {
    ref: 4,
    imageUrl: unsplash("1426604966848-d7adac402bff", 600, 440),
    width: 600,
    height: 440,
    title: "El Capitan, Yosemite",
    creator: "north",
    category: "Mountains",
    description: "Morning light on the granite face above the valley meadow.",
  },
  {
    ref: 5,
    imageUrl: unsplash("1441974231531-c6227db76b6e", 600, 760),
    width: 600,
    height: 760,
    title: "Path through the woods",
    creator: "bloom",
    category: "Nature",
    description: "A quiet trail winding between tall trees in soft afternoon light.",
  },
  {
    ref: 6,
    imageUrl: unsplash("1493246507139-91e8fad9978e", 600, 440),
    width: 600,
    height: 440,
    title: "Moraine Lake at sunrise",
    creator: "atlas",
    category: "Mountains",
    description: "Alpenglow over the Valley of the Ten Peaks in Banff, Canada.",
  },
  {
    ref: 7,
    imageUrl: unsplash("1518791841217-8f162f1e1131", 600, 600),
    width: 600,
    height: 600,
    title: "Curious tabby",
    creator: "bloom",
    category: "Animals",
    description: "A tabby cat caught mid-stare on a soft grey couch.",
  },
  {
    ref: 8,
    imageUrl: unsplash("1543466835-00a7907e9de1", 600, 640),
    width: 600,
    height: 640,
    title: "Happy beagle",
    creator: "mira",
    category: "Animals",
    description: "A grinning beagle on a woodland walk.",
  },
  {
    ref: 9,
    imageUrl: unsplash("1504674900247-0877df9cc836", 600, 460),
    width: 600,
    height: 460,
    title: "Thai beef salad",
    creator: "bloom",
    category: "Food",
    description: "Seared beef with crisp greens, chilli and cashews.",
  },
  {
    ref: 10,
    imageUrl: unsplash("1565299624946-b28f40a0ae38", 600, 600),
    width: 600,
    height: 600,
    title: "Wood-fired pizza",
    creator: "bloom",
    category: "Food",
    description: "A blistered pizza topped with red onion and fresh coriander.",
  },
  {
    ref: 11,
    imageUrl: unsplash("1540189549336-e6e99c3679fe", 600, 760),
    width: 600,
    height: 760,
    title: "Garden bowl & juice",
    creator: "mira",
    category: "Food",
    description: "A crunchy salad bowl with a glass of fresh orange juice.",
  },
  {
    ref: 12,
    imageUrl: unsplash("1502602898657-3e91760cbb34", 600, 600),
    width: 600,
    height: 600,
    title: "Paris at dusk",
    creator: "north",
    category: "Travel",
    description: "The Eiffel Tower glowing over the Seine at blue hour.",
  },
  {
    ref: 13,
    imageUrl: unsplash("1499856871958-5b9627545d1a", 600, 440),
    width: 600,
    height: 440,
    title: "Pont Alexandre III",
    creator: "north",
    category: "Travel",
    description: "Golden lamps lining the most ornate bridge in Paris.",
  },
  {
    ref: 14,
    imageUrl: unsplash("1542051841857-5f90071e7989", 600, 760),
    width: 600,
    height: 760,
    title: "Shibuya after dark",
    creator: "mira",
    category: "City",
    description: "Neon signs and crossings in the heart of Tokyo at night.",
  },
  {
    ref: 15,
    imageUrl: unsplash("1480714378408-67cf0d13bc1b", 600, 440),
    width: 600,
    height: 440,
    title: "Manhattan sunset",
    creator: "atlas",
    category: "City",
    description: "Low sunlight raking across the Midtown skyline.",
  },
  {
    ref: 16,
    imageUrl: unsplash("1506905925346-21bda4d32df4", 600, 460),
    width: 600,
    height: 460,
    title: "Peaks above the clouds",
    creator: "north",
    category: "Mountains",
    description: "Snowy summits rising over a sea of cloud at sunset.",
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
 * This demo dataset is for development only and refuses to run in production.
 *
 * @returns A promise that resolves when seeding completes.
 */
async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to seed: the demo dataset (including a demo account) must not run in production.",
    );
  }

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
    update: { name: "You", username: "you", passwordHash: demoPasswordHash, role: "USER" },
    create: {
      id: "user_demo",
      email: "demo@mosaic.app",
      name: "You",
      username: "you",
      avatarUrl: "/images/creator1.png",
      passwordHash: demoPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@mosaic.app" },
    update: { role: "ADMIN", passwordHash: demoPasswordHash },
    create: {
      id: "user_admin",
      email: "admin@mosaic.app",
      name: "Admin",
      username: "admin",
      avatarUrl: "/images/creator2.png",
      passwordHash: demoPasswordHash,
      role: "ADMIN",
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

  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: "board_demo_quick", userId: "user_demo" } },
    update: { role: "OWNER" },
    create: { boardId: "board_demo_quick", userId: "user_demo", role: "OWNER" },
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
        category: { connect: { slug: slugify(pin.category) } },
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

  const seededPinIds = pins.map((pin) => `pin_${pin.ref}`);
  await prisma.pin.deleteMany({ where: { id: { notIn: seededPinIds } } });

  const seededSlugs = categories.map((category) => slugify(category.label));
  await prisma.category.deleteMany({ where: { slug: { notIn: seededSlugs } } });

  for (const ref of [1, 6]) {
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
  await prisma.follow.upsert({
    where: { followerId_creatorId: { followerId: "user_mira", creatorId: "user_demo" } },
    update: {},
    create: { followerId: "user_mira", creatorId: "user_demo" },
  });
  await prisma.user.update({
    where: { email: "mira@mosaic.app" },
    data: { passwordHash: demoPasswordHash },
  });

  await prisma.conversation.upsert({
    where: { id: "conversation_demo" },
    update: {},
    create: {
      id: "conversation_demo",
      pairKey: ["user_demo", "user_mira"].sort().join(":"),
      participants: {
        create: [{ userId: "user_demo" }, { userId: "user_mira" }],
      },
    },
  });
  const demoMessages: { id: string; senderId: string; body: string }[] = [
    { id: "message_demo_1", senderId: "user_mira", body: "Hey! Loved your latest board ✨" },
    { id: "message_demo_2", senderId: "user_demo", body: "Thanks Mira! Yours is goals 😍" },
    {
      id: "message_demo_3",
      senderId: "user_mira",
      body: "We should collaborate on a travel board.",
    },
  ];
  for (const message of demoMessages) {
    await prisma.message.upsert({
      where: { id: message.id },
      update: {},
      create: {
        id: message.id,
        conversationId: "conversation_demo",
        senderId: message.senderId,
        body: message.body,
      },
    });
  }

  await prisma.comment.upsert({
    where: { id: "comment_demo" },
    update: { body: "Stunning shot — saving this for my next trip board!" },
    create: {
      id: "comment_demo",
      body: "Stunning shot — saving this for my next trip board!",
      pinId: "pin_1",
      authorId: "user_demo",
    },
  });

  await prisma.report.upsert({
    where: { pinId_reporterId: { pinId: "pin_2", reporterId: "user_demo" } },
    update: { status: "PENDING", reason: "Looks like spam." },
    create: {
      pinId: "pin_2",
      reporterId: "user_demo",
      reason: "Looks like spam.",
      status: "PENDING",
    },
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
