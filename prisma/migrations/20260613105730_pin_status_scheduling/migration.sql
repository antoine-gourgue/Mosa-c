-- CreateEnum
CREATE TYPE "PinStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- AlterTable
ALTER TABLE "Pin" ADD COLUMN     "publishAt" TIMESTAMP(3),
ADD COLUMN     "status" "PinStatus" NOT NULL DEFAULT 'PUBLISHED';

