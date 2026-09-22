-- AlterTable: Add clientId column to Lead table with SERIAL autoincrement
ALTER TABLE "Lead" ADD COLUMN "clientId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Lead_clientId_key" ON "Lead"("clientId");
