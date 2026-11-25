-- CreateEnum
CREATE TYPE "AdvanceTransactionType" AS ENUM ('GIVEN', 'RETURNED');

-- CreateTable
CREATE TABLE "AdvanceAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalGiven" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReturned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvanceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvanceTransaction" (
    "id" TEXT NOT NULL,
    "advanceAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AdvanceTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "purpose" TEXT NOT NULL,
    "voucherNo" TEXT,
    "note" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvanceAccount_userId_key" ON "AdvanceAccount"("userId");

-- CreateIndex
CREATE INDEX "AdvanceAccount_userId_idx" ON "AdvanceAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdvanceTransaction_voucherNo_key" ON "AdvanceTransaction"("voucherNo");

-- CreateIndex
CREATE INDEX "AdvanceTransaction_advanceAccountId_idx" ON "AdvanceTransaction"("advanceAccountId");

-- CreateIndex
CREATE INDEX "AdvanceTransaction_userId_idx" ON "AdvanceTransaction"("userId");

-- CreateIndex
CREATE INDEX "AdvanceTransaction_type_idx" ON "AdvanceTransaction"("type");

-- CreateIndex
CREATE INDEX "AdvanceTransaction_date_idx" ON "AdvanceTransaction"("date");

-- AddForeignKey
ALTER TABLE "AdvanceAccount" ADD CONSTRAINT "AdvanceAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceTransaction" ADD CONSTRAINT "AdvanceTransaction_advanceAccountId_fkey" FOREIGN KEY ("advanceAccountId") REFERENCES "AdvanceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceTransaction" ADD CONSTRAINT "AdvanceTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvanceTransaction" ADD CONSTRAINT "AdvanceTransaction_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
