-- CreateEnum
CREATE TYPE "PinMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Pin" ADD COLUMN     "mediaType" "PinMediaType" NOT NULL DEFAULT 'IMAGE',
ADD COLUMN     "videoDurationS" INTEGER,
ADD COLUMN     "videoUrl" TEXT;
