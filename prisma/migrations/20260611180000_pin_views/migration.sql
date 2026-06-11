-- CreateTable
CREATE TABLE "PinView" (
    "pinId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PinView_pkey" PRIMARY KEY ("pinId","viewerId","viewedOn")
);

-- CreateIndex
CREATE INDEX "PinView_pinId_idx" ON "PinView"("pinId");

-- CreateIndex
CREATE INDEX "PinView_viewerId_idx" ON "PinView"("viewerId");

-- AddForeignKey
ALTER TABLE "PinView" ADD CONSTRAINT "PinView_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinView" ADD CONSTRAINT "PinView_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
