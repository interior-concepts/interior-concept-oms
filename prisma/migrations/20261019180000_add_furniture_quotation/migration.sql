-- CreateTable
CREATE TABLE "FurnitureQuotationDraft" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "content" JSONB NOT NULL,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "QuotationDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FurnitureQuotationDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FurnitureQuotationSavedItem" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Nos',
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serialNo" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FurnitureQuotationSavedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FurnitureQuotationDraft_leadId_key" ON "FurnitureQuotationDraft"("leadId");

-- CreateIndex
CREATE INDEX "FurnitureQuotationDraft_createdById_idx" ON "FurnitureQuotationDraft"("createdById");

-- CreateIndex
CREATE INDEX "FurnitureQuotationDraft_status_idx" ON "FurnitureQuotationDraft"("status");

-- CreateIndex
CREATE INDEX "FurnitureQuotationSavedItem_section_isActive_serialNo_idx" ON "FurnitureQuotationSavedItem"("section", "isActive", "serialNo");

-- AddForeignKey
ALTER TABLE "FurnitureQuotationDraft" ADD CONSTRAINT "FurnitureQuotationDraft_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FurnitureQuotationDraft" ADD CONSTRAINT "FurnitureQuotationDraft_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FurnitureQuotationDraft" ADD CONSTRAINT "FurnitureQuotationDraft_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
