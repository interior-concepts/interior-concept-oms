
-- 5. Enums for Missing Models
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VendorStatus') THEN
      CREATE TYPE "VendorStatus" AS ENUM ('ACTIVE', 'DISABLED');
    END IF;
  END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VendorType') THEN
      CREATE TYPE "VendorType" AS ENUM ('SUPPLIER', 'CONTRACTOR', 'PAINTER', 'CARPENTER', 'SERVICE_PROVIDER', 'FREELANCER', 'OTHER');
    END IF;
  END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VendorWorkStatus') THEN
      CREATE TYPE "VendorWorkStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'WORK_DONE', 'CLOSED');
    END IF;
  END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VendorPaymentMethod') THEN
      CREATE TYPE "VendorPaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_BANKING');
    END IF;
  END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockCategory') THEN
      CREATE TYPE "StockCategory" AS ENUM ('STATIONERY_OFFICE', 'PANTRY_HYGIENE', 'IT_EQUIPMENT', 'BOARD', 'LAMINATE_HPL', 'HARDWARE', 'FITTINGS', 'PAINT_FINISHES', 'LIGHTING_ELECTRICAL', 'GLASS_MIRROR', 'RAW_MATERIALS', 'TOOLS_CONSUMABLES', 'OTHER');
    END IF;
  END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StockMovementType') THEN
      CREATE TYPE "StockMovementType" AS ENUM ('STOCK_IN', 'DEPARTMENT_ISSUE', 'STAFF_ISSUE', 'PROJECT_ISSUE', 'PROJECT_RETURN', 'VENDOR_RETURN', 'ADJUSTMENT');
    END IF;
  END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupplierStatus') THEN
      CREATE TYPE "SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE');
    END IF;
  END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuotationWorkType') THEN
      CREATE TYPE "QuotationWorkType" AS ENUM ('DETAIL', 'SHORT', 'FURNITURE', 'ELECTRICAL');
    END IF;
  END $$;

-- 6. Create Missing Tables If Not Exist
CREATE TABLE IF NOT EXISTS "FinanceAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "JrArchitectPerformance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "totalWork" INTEGER NOT NULL DEFAULT 0,
    "totalSqft" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "performanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JrArchitectPerformance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DepartmentMemberMonthlySetting" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentMemberMonthlySetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Vendor" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorCompanyName" TEXT,
    "vendorName" TEXT NOT NULL,
    "status" "VendorStatus" NOT NULL DEFAULT 'ACTIVE',
    "vendorType" "VendorType" NOT NULL,
    "bankName" TEXT,
    "routingNumber" TEXT,
    "accountNumber" TEXT,
    "primaryEmail" TEXT,
    "primaryPhone" TEXT,
    "billingAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VendorAgreement" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "agreementValue" DOUBLE PRECISION NOT NULL,
    "workScope" TEXT,
    "workStatus" "VendorWorkStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "retentionPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionReleased" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorAgreement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VendorAgreementRevision" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "oldValue" DOUBLE PRECISION NOT NULL,
    "newValue" DOUBLE PRECISION NOT NULL,
    "changeReason" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorAgreementRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VendorPaymentMilestone" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPaymentMilestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "VendorPayment" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "VendorPaymentMethod" NOT NULL DEFAULT 'CASH',
    "voucherNo" TEXT,
    "note" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockItem" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "StockCategory" NOT NULL DEFAULT 'OTHER',
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStockAlert" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "unitCostPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "standardSellingPrice" DOUBLE PRECISION,
    "vendorId" TEXT,
    "location" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "StockMovement" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "referenceNo" TEXT,
    "leadId" TEXT,
    "vendorId" TEXT,
    "transactionId" TEXT,
    "department" TEXT,
    "recipientUserId" TEXT,
    "createdById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BoqSavedApplianceItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "brand" TEXT NOT NULL DEFAULT '',
    "modelCode" TEXT NOT NULL DEFAULT '',
    "brandModelCode" TEXT NOT NULL DEFAULT '',
    "dimW" TEXT NOT NULL DEFAULT '',
    "dimD" TEXT NOT NULL DEFAULT '',
    "dimH" TEXT NOT NULL DEFAULT '',
    "cabinetNicheCutOutSize" TEXT NOT NULL DEFAULT '',
    "defaultUnitPrice" TEXT NOT NULL DEFAULT '',
    "defaultUnit" TEXT NOT NULL DEFAULT 'Nos',
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "serialNo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoqSavedApplianceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL,
    "supplierCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "supplyCategory" TEXT,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "routingNumber" TEXT,
    "notes" TEXT,
    "status" "SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuotationDailyWorkReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "dateKey" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "workType" "QuotationWorkType" NOT NULL DEFAULT 'DETAIL',
    "sqft" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isAutoDetected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationDailyWorkReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "QuotationWorkActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "workType" "QuotationWorkType" NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateKey" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationWorkActivityLog_pkey" PRIMARY KEY ("id")
);

-- 7. Create Indexes If Not Exist
CREATE UNIQUE INDEX IF NOT EXISTS "FinanceAccount_name_key" ON "FinanceAccount"("name");
CREATE INDEX IF NOT EXISTS "JrArchitectPerformance_userId_idx" ON "JrArchitectPerformance"("userId");
CREATE INDEX IF NOT EXISTS "JrArchitectPerformance_monthYear_idx" ON "JrArchitectPerformance"("monthYear");
CREATE UNIQUE INDEX IF NOT EXISTS "JrArchitectPerformance_userId_monthYear_key" ON "JrArchitectPerformance"("userId", "monthYear");
CREATE INDEX IF NOT EXISTS "DepartmentMemberMonthlySetting_department_monthKey_idx" ON "DepartmentMemberMonthlySetting"("department", "monthKey");
CREATE INDEX IF NOT EXISTS "DepartmentMemberMonthlySetting_userId_idx" ON "DepartmentMemberMonthlySetting"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "DepartmentMemberMonthlySetting_department_userId_monthKey_key" ON "DepartmentMemberMonthlySetting"("department", "userId", "monthKey");
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_vendorId_key" ON "Vendor"("vendorId");
CREATE INDEX IF NOT EXISTS "Vendor_status_idx" ON "Vendor"("status");
CREATE INDEX IF NOT EXISTS "Vendor_vendorType_idx" ON "Vendor"("vendorType");
CREATE INDEX IF NOT EXISTS "VendorAgreement_vendorId_idx" ON "VendorAgreement"("vendorId");
CREATE INDEX IF NOT EXISTS "VendorAgreement_leadId_idx" ON "VendorAgreement"("leadId");
CREATE INDEX IF NOT EXISTS "VendorAgreement_workStatus_idx" ON "VendorAgreement"("workStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "VendorAgreement_vendorId_leadId_key" ON "VendorAgreement"("vendorId", "leadId");
CREATE INDEX IF NOT EXISTS "VendorAgreementRevision_agreementId_idx" ON "VendorAgreementRevision"("agreementId");
CREATE INDEX IF NOT EXISTS "VendorPaymentMilestone_agreementId_idx" ON "VendorPaymentMilestone"("agreementId");
CREATE INDEX IF NOT EXISTS "VendorPaymentMilestone_isPaid_idx" ON "VendorPaymentMilestone"("isPaid");
CREATE UNIQUE INDEX IF NOT EXISTS "VendorPayment_voucherNo_key" ON "VendorPayment"("voucherNo");
CREATE UNIQUE INDEX IF NOT EXISTS "VendorPayment_transactionId_key" ON "VendorPayment"("transactionId");
CREATE INDEX IF NOT EXISTS "VendorPayment_agreementId_idx" ON "VendorPayment"("agreementId");
CREATE INDEX IF NOT EXISTS "VendorPayment_milestoneId_idx" ON "VendorPayment"("milestoneId");
CREATE INDEX IF NOT EXISTS "VendorPayment_paymentDate_idx" ON "VendorPayment"("paymentDate");
CREATE UNIQUE INDEX IF NOT EXISTS "StockItem_sku_key" ON "StockItem"("sku");
CREATE INDEX IF NOT EXISTS "StockItem_category_idx" ON "StockItem"("category");
CREATE INDEX IF NOT EXISTS "StockItem_isActive_idx" ON "StockItem"("isActive");
CREATE INDEX IF NOT EXISTS "StockMovement_stockItemId_idx" ON "StockMovement"("stockItemId");
CREATE INDEX IF NOT EXISTS "StockMovement_type_idx" ON "StockMovement"("type");
CREATE INDEX IF NOT EXISTS "StockMovement_leadId_idx" ON "StockMovement"("leadId");
CREATE INDEX IF NOT EXISTS "StockMovement_vendorId_idx" ON "StockMovement"("vendorId");
CREATE INDEX IF NOT EXISTS "StockMovement_department_idx" ON "StockMovement"("department");
CREATE INDEX IF NOT EXISTS "StockMovement_recipientUserId_idx" ON "StockMovement"("recipientUserId");
CREATE INDEX IF NOT EXISTS "StockMovement_createdById_idx" ON "StockMovement"("createdById");
CREATE INDEX IF NOT EXISTS "StockMovement_createdAt_idx" ON "StockMovement"("createdAt");
CREATE INDEX IF NOT EXISTS "BoqSavedApplianceItem_isActive_serialNo_idx" ON "BoqSavedApplianceItem"("isActive", "serialNo");
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_supplierCode_key" ON "Supplier"("supplierCode");
CREATE INDEX IF NOT EXISTS "Supplier_status_idx" ON "Supplier"("status");
CREATE INDEX IF NOT EXISTS "Supplier_supplyCategory_idx" ON "Supplier"("supplyCategory");
CREATE INDEX IF NOT EXISTS "QuotationDailyWorkReport_userId_dateKey_idx" ON "QuotationDailyWorkReport"("userId", "dateKey");
CREATE INDEX IF NOT EXISTS "QuotationDailyWorkReport_userId_weekKey_idx" ON "QuotationDailyWorkReport"("userId", "weekKey");
CREATE INDEX IF NOT EXISTS "QuotationDailyWorkReport_leadId_idx" ON "QuotationDailyWorkReport"("leadId");
CREATE INDEX IF NOT EXISTS "QuotationDailyWorkReport_dateKey_idx" ON "QuotationDailyWorkReport"("dateKey");
CREATE UNIQUE INDEX IF NOT EXISTS "QuotationDailyWorkReport_userId_leadId_dateKey_workType_key" ON "QuotationDailyWorkReport"("userId", "leadId", "dateKey", "workType");
CREATE INDEX IF NOT EXISTS "QuotationWorkActivityLog_userId_dateKey_idx" ON "QuotationWorkActivityLog"("userId", "dateKey");
CREATE INDEX IF NOT EXISTS "QuotationWorkActivityLog_leadId_idx" ON "QuotationWorkActivityLog"("leadId");
