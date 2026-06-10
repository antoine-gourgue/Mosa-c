-- DropIndex
DROP INDEX "AccountToken_userId_kind_idx";

-- CreateIndex
CREATE UNIQUE INDEX "AccountToken_userId_kind_key" ON "AccountToken"("userId", "kind");
