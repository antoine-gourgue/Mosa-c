-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HighlightStory" (
    "highlightId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "HighlightStory_pkey" PRIMARY KEY ("highlightId","storyId")
);

-- CreateIndex
CREATE INDEX "Highlight_ownerId_idx" ON "Highlight"("ownerId");

-- CreateIndex
CREATE INDEX "HighlightStory_storyId_idx" ON "HighlightStory"("storyId");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightStory" ADD CONSTRAINT "HighlightStory_highlightId_fkey" FOREIGN KEY ("highlightId") REFERENCES "Highlight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightStory" ADD CONSTRAINT "HighlightStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
