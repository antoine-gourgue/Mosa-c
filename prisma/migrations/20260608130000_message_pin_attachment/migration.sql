-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "pinId" TEXT;

-- CreateIndex
CREATE INDEX "Message_pinId_idx" ON "Message"("pinId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
