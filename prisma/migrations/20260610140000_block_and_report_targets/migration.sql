-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('PIN', 'COMMENT', 'USER');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "commentId" TEXT,
ADD COLUMN     "targetType" "ReportTargetType" NOT NULL DEFAULT 'PIN',
ADD COLUMN     "targetUserId" TEXT,
ALTER COLUMN "pinId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Block" (
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerId","blockedId")
);

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_commentId_reporterId_key" ON "Report"("commentId", "reporterId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_targetUserId_reporterId_key" ON "Report"("targetUserId", "reporterId");

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
