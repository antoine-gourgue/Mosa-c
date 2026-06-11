-- CreateTable
CREATE TABLE "BoardFollow" (
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardFollow_pkey" PRIMARY KEY ("userId","boardId")
);

-- CreateIndex
CREATE INDEX "BoardFollow_boardId_idx" ON "BoardFollow"("boardId");

-- AddForeignKey
ALTER TABLE "BoardFollow" ADD CONSTRAINT "BoardFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardFollow" ADD CONSTRAINT "BoardFollow_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
