-- CreateTable
CREATE TABLE "PinEmbedding" (
    "pinId" TEXT NOT NULL,
    "vector" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PinEmbedding_pkey" PRIMARY KEY ("pinId")
);

-- AddForeignKey
ALTER TABLE "PinEmbedding" ADD CONSTRAINT "PinEmbedding_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
