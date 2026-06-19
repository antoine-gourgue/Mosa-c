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

type PinSeed = {
  ref: number;
  imageUrl: string;
  width: number;
  height: number;
  title: string;
  creator: string;
  tag: string;
  description: string;
  place?: { name: string; address: string; lat: number; lng: number; approximate?: boolean };
  status?: "DRAFT" | "SCHEDULED";
  mediaType?: "VIDEO";
  videoUrl?: string;
  videoDurationS?: number;
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

const pins: PinSeed[] = [
  {
    ref: 1,
    imageUrl: unsplash("1501785888041-af3ef285b470", 600, 460),
    width: 600,
    height: 460,
    title: "Lago di Braies, Dolomites",
    creator: "atlas",
    tag: "Travel",
    description: "Turquoise water and wooden rowboats beneath the Dolomite cliffs.",
    place: { name: "Lago di Braies", address: "Dolomites, Italy", lat: 46.6946, lng: 12.085 },
  },
  {
    ref: 2,
    imageUrl: unsplash("1469474968028-56623f02e42e", 600, 520),
    width: 600,
    height: 520,
    title: "Above the green valley",
    creator: "north",
    tag: "Nature",
    description: "A lone hiker on a ridge above mist-filled, forested hills.",
  },
  {
    ref: 3,
    imageUrl: unsplash("1470770841072-f978cf4d019e", 600, 500),
    width: 600,
    height: 500,
    title: "Lakeside cabin in the Alps",
    creator: "atlas",
    tag: "Travel",
    description: "A wooden boathouse on a still mountain lake at first light.",
    place: {
      name: "Oeschinen Lake",
      address: "Bernese Alps, Switzerland",
      lat: 46.4983,
      lng: 7.73,
    },
  },
  {
    ref: 4,
    imageUrl: unsplash("1426604966848-d7adac402bff", 600, 440),
    width: 600,
    height: 440,
    title: "El Capitan, Yosemite",
    creator: "north",
    tag: "Mountains",
    description: "Morning light on the granite face above the valley meadow.",
  },
  {
    ref: 5,
    imageUrl: unsplash("1441974231531-c6227db76b6e", 600, 760),
    width: 600,
    height: 760,
    title: "Path through the woods",
    creator: "bloom",
    tag: "Nature",
    description: "A quiet trail winding between tall trees in soft afternoon light.",
  },
  {
    ref: 6,
    imageUrl: unsplash("1493246507139-91e8fad9978e", 600, 440),
    width: 600,
    height: 440,
    title: "Moraine Lake at sunrise",
    creator: "atlas",
    tag: "Mountains",
    description: "Alpenglow over the Valley of the Ten Peaks in Banff, Canada.",
  },
  {
    ref: 7,
    imageUrl: unsplash("1518791841217-8f162f1e1131", 600, 600),
    width: 600,
    height: 600,
    title: "Curious tabby",
    creator: "bloom",
    tag: "Animals",
    description: "A tabby cat caught mid-stare on a soft grey couch.",
  },
  {
    ref: 8,
    imageUrl: unsplash("1543466835-00a7907e9de1", 600, 640),
    width: 600,
    height: 640,
    title: "Happy beagle",
    creator: "mira",
    tag: "Animals",
    description: "A grinning beagle on a woodland walk.",
  },
  {
    ref: 9,
    imageUrl: unsplash("1504674900247-0877df9cc836", 600, 460),
    width: 600,
    height: 460,
    title: "Thai beef salad",
    creator: "bloom",
    tag: "Food",
    description: "Seared beef with crisp greens, chilli and cashews.",
  },
  {
    ref: 10,
    imageUrl: unsplash("1565299624946-b28f40a0ae38", 600, 600),
    width: 600,
    height: 600,
    title: "Wood-fired pizza",
    creator: "bloom",
    tag: "Food",
    description: "A blistered pizza topped with red onion and fresh coriander.",
  },
  {
    ref: 11,
    imageUrl: unsplash("1540189549336-e6e99c3679fe", 600, 760),
    width: 600,
    height: 760,
    title: "Garden bowl & juice",
    creator: "mira",
    tag: "Food",
    description: "A crunchy salad bowl with a glass of fresh orange juice.",
  },
  {
    ref: 12,
    imageUrl: unsplash("1502602898657-3e91760cbb34", 600, 600),
    width: 600,
    height: 600,
    title: "Paris at dusk",
    creator: "north",
    tag: "Travel",
    description: "The Eiffel Tower glowing over the Seine at blue hour.",
  },
  {
    ref: 13,
    imageUrl: unsplash("1499856871958-5b9627545d1a", 600, 440),
    width: 600,
    height: 440,
    title: "Pont Alexandre III",
    creator: "north",
    tag: "Travel",
    description: "Golden lamps lining the most ornate bridge in Paris.",
  },
  {
    ref: 14,
    imageUrl: unsplash("1542051841857-5f90071e7989", 600, 760),
    width: 600,
    height: 760,
    title: "Shibuya after dark",
    creator: "mira",
    tag: "City",
    description: "Neon signs and crossings in the heart of Tokyo at night.",
  },
  {
    ref: 15,
    imageUrl: unsplash("1480714378408-67cf0d13bc1b", 600, 440),
    width: 600,
    height: 440,
    title: "Manhattan sunset",
    creator: "atlas",
    tag: "City",
    description: "Low sunlight raking across the Midtown skyline.",
  },
  {
    ref: 16,
    imageUrl: unsplash("1506905925346-21bda4d32df4", 600, 460),
    width: 600,
    height: 460,
    title: "Peaks above the clouds",
    creator: "north",
    tag: "Mountains",
    description: "Snowy summits rising over a sea of cloud at sunset.",
  },
  {
    ref: 17,
    imageUrl: unsplash("1469474968028-56623f02e42e", 600, 520),
    width: 600,
    height: 520,
    title: "Trailhead notes (draft)",
    creator: "demo",
    tag: "Nature",
    description: "Saved for later — still picking the best shot.",
    status: "DRAFT",
  },
  {
    ref: 18,
    imageUrl: unsplash("1502602898657-3e91760cbb34", 600, 600),
    width: 600,
    height: 600,
    title: "Paris rooftops at golden hour",
    creator: "demo",
    tag: "Travel",
    description: "Scheduled to go live with the weekend travel set.",
    status: "SCHEDULED",
    place: { name: "Montmartre", address: "Paris, France", lat: 48.8867, lng: 2.3431 },
  },
  {
    ref: 19,
    imageUrl: "/images/sample-clip-poster.jpg",
    width: 1280,
    height: 720,
    title: "Big Buck Bunny (sample clip)",
    creator: "atlas",
    tag: "Nature",
    description: "A short clip from the open-source Blender short film.",
    mediaType: "VIDEO",
    videoUrl: "/videos/sample-clip.mp4",
    videoDurationS: 10,
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

  const tagLabels = [...new Set(pins.map((pin) => pin.tag))];
  for (const label of tagLabels) {
    const slug = slugify(label);
    await prisma.tag.upsert({
      where: { slug },
      update: { name: label },
      create: { slug, name: label },
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
        emailVerified: new Date(),
      },
      create: {
        id: `user_${creator.key}`,
        email: `${creator.key}@mosaic.app`,
        name: creator.name,
        username: creator.key,
        avatarUrl: creator.avatarUrl,
        followersLabel: creator.followersLabel,
        verified: true,
        emailVerified: new Date(),
      },
    });
  }

  const demoPasswordHash = await hash("password123", 12);
  await prisma.user.upsert({
    where: { email: "demo@mosaic.app" },
    update: {
      name: "You",
      username: "you",
      passwordHash: demoPasswordHash,
      role: "USER",
      emailVerified: new Date(),
    },
    create: {
      id: "user_demo",
      email: "demo@mosaic.app",
      name: "You",
      username: "you",
      avatarUrl: "/images/creator1.png",
      passwordHash: demoPasswordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@mosaic.app" },
    update: { role: "ADMIN", passwordHash: demoPasswordHash, emailVerified: new Date() },
    create: {
      id: "user_admin",
      email: "admin@mosaic.app",
      name: "Admin",
      username: "admin",
      avatarUrl: "/images/creator2.png",
      passwordHash: demoPasswordHash,
      role: "ADMIN",
      emailVerified: new Date(),
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
        placeName: pin.place?.name ?? null,
        placeAddress: pin.place?.address ?? null,
        lat: pin.place?.lat ?? null,
        lng: pin.place?.lng ?? null,
        placeApproximate: pin.place?.approximate ?? false,
        status: pin.status ?? "PUBLISHED",
        publishAt: pin.status === "SCHEDULED" ? new Date(Date.now() + 3 * 86_400_000) : null,
        mediaType: pin.mediaType ?? "IMAGE",
        videoUrl: pin.videoUrl ?? null,
        videoDurationS: pin.videoDurationS ?? null,
      },
      create: {
        id: `pin_${pin.ref}`,
        title: pin.title,
        description: pin.description,
        imageUrl: pin.imageUrl,
        width: pin.width,
        height: pin.height,
        placeName: pin.place?.name ?? null,
        placeAddress: pin.place?.address ?? null,
        lat: pin.place?.lat ?? null,
        lng: pin.place?.lng ?? null,
        placeApproximate: pin.place?.approximate ?? false,
        status: pin.status ?? "PUBLISHED",
        publishAt: pin.status === "SCHEDULED" ? new Date(Date.now() + 3 * 86_400_000) : null,
        mediaType: pin.mediaType ?? "IMAGE",
        videoUrl: pin.videoUrl ?? null,
        videoDurationS: pin.videoDurationS ?? null,
        creator: { connect: { id: `user_${pin.creator}` } },
      },
    });
    const tag = await prisma.tag.findUnique({ where: { slug: slugify(pin.tag) } });
    if (tag !== null) {
      await prisma.pinTag.upsert({
        where: { pinId_tagId: { pinId: `pin_${pin.ref}`, tagId: tag.id } },
        update: {},
        create: { pinId: `pin_${pin.ref}`, tagId: tag.id },
      });
    }
  }

  const seededPinIds = pins.map((pin) => `pin_${pin.ref}`);
  await prisma.pin.deleteMany({ where: { id: { notIn: seededPinIds } } });
  await prisma.tag.deleteMany({ where: { pins: { none: {} } } });

  const storySeeds = [
    {
      id: "story_demo_1",
      authorId: "user_demo",
      mediaType: "IMAGE" as const,
      imageUrl: unsplash("1469474968028-56623f02e42e", 720, 1280),
      videoUrl: null as string | null,
      width: 720,
      height: 1280,
      videoDurationS: null as number | null,
    },
    {
      id: "story_mira_1",
      authorId: "user_mira",
      mediaType: "IMAGE" as const,
      imageUrl: unsplash("1441974231531-c6227db76b6e", 720, 1280),
      videoUrl: null as string | null,
      width: 720,
      height: 1280,
      videoDurationS: null as number | null,
    },
    {
      id: "story_mira_2",
      authorId: "user_mira",
      mediaType: "VIDEO" as const,
      imageUrl: "/images/sample-clip-poster.jpg",
      videoUrl: "/videos/sample-clip.mp4",
      width: 1280,
      height: 720,
      videoDurationS: 10,
    },
  ];
  for (const story of storySeeds) {
    const { id, ...rest } = story;
    const data = { ...rest, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
    await prisma.story.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  await prisma.story.deleteMany({ where: { id: { notIn: storySeeds.map((s) => s.id) } } });

  for (const ref of [1, 6]) {
    await prisma.save.upsert({
      where: { userId_pinId: { userId: "user_demo", pinId: `pin_${ref}` } },
      update: {},
      create: { userId: "user_demo", pinId: `pin_${ref}` },
    });
  }

  const demoBoards = [
    { id: "board_demo_travel", name: "Travel ideas", pins: [1, 3, 12, 13, 6] },
    { id: "board_demo_food", name: "On the menu", pins: [9, 10, 11] },
    { id: "board_demo_peaks", name: "Peaks & trails", pins: [4, 16, 2, 5] },
  ];
  for (const board of demoBoards) {
    await prisma.board.upsert({
      where: { id: board.id },
      update: { name: board.name },
      create: { id: board.id, name: board.name, owner: { connect: { id: "user_demo" } } },
    });
    await prisma.boardMember.upsert({
      where: { boardId_userId: { boardId: board.id, userId: "user_demo" } },
      update: { role: "OWNER" },
      create: { boardId: board.id, userId: "user_demo", role: "OWNER" },
    });
    for (const ref of board.pins) {
      await prisma.boardPin.upsert({
        where: { boardId_pinId: { boardId: board.id, pinId: `pin_${ref}` } },
        update: {},
        create: { boardId: board.id, pinId: `pin_${ref}` },
      });
    }
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

  await prisma.conversation.upsert({
    where: { id: "conversation_request" },
    update: { status: "PENDING", requestedById: "user_atlas" },
    create: {
      id: "conversation_request",
      pairKey: ["user_demo", "user_atlas"].sort().join(":"),
      status: "PENDING",
      requestedById: "user_atlas",
      participants: {
        create: [{ userId: "user_demo" }, { userId: "user_atlas" }],
      },
    },
  });
  await prisma.message.upsert({
    where: { id: "message_request_1" },
    update: {},
    create: {
      id: "message_request_1",
      conversationId: "conversation_request",
      senderId: "user_atlas",
      body: "Hi! I love your boards — can we chat?",
    },
  });

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
