-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "requestedById" TEXT,
ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'ACCEPTED';

