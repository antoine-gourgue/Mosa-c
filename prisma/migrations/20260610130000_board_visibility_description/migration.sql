-- CreateEnum
CREATE TYPE "BoardVisibility" AS ENUM ('PUBLIC', 'SECRET');

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "description" TEXT,
ADD COLUMN     "visibility" "BoardVisibility" NOT NULL DEFAULT 'PUBLIC';

