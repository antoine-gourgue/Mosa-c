-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinTag" (
    "pinId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PinTag_pkey" PRIMARY KEY ("pinId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "PinTag_tagId_idx" ON "PinTag"("tagId");

-- AddForeignKey
ALTER TABLE "PinTag" ADD CONSTRAINT "PinTag_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinTag" ADD CONSTRAINT "PinTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill tags from existing categories (reuse the category id as the tag id)
INSERT INTO "Tag" ("id", "slug", "name", "createdAt")
SELECT "id", "slug", "label", CURRENT_TIMESTAMP FROM "Category";

INSERT INTO "PinTag" ("pinId", "tagId")
SELECT "id", "categoryId" FROM "Pin" WHERE "categoryId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Pin" DROP CONSTRAINT "Pin_categoryId_fkey";

-- DropIndex
DROP INDEX "Pin_categoryId_idx";

-- AlterTable
ALTER TABLE "Pin" DROP COLUMN "categoryId";

-- DropTable
DROP TABLE "Category";
