-- Convert Vendor.vendorType from VendorType enum to TEXT so custom vendor types are supported
ALTER TABLE "Vendor"
  ALTER COLUMN "vendorType" TYPE TEXT USING "vendorType"::TEXT;

DROP TYPE IF EXISTS "VendorType";

-- Add new financial & multi-contact/address columns on Vendor
ALTER TABLE "Vendor"
  ADD COLUMN IF NOT EXISTS "bankBranch" TEXT,
  ADD COLUMN IF NOT EXISTS "accountName" TEXT,
  ADD COLUMN IF NOT EXISTS "primaryPhones" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "billingAddresses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Create VendorTypeOption table for saved custom vendor types
CREATE TABLE IF NOT EXISTS "VendorTypeOption" (
  "id" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VendorTypeOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VendorTypeOption_value_key" ON "VendorTypeOption"("value");

-- Create VendorBankAccount table for multiple bank details per vendor
CREATE TABLE IF NOT EXISTS "VendorBankAccount" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "bankName" TEXT,
  "bankBranch" TEXT,
  "accountName" TEXT,
  "routingNumber" TEXT,
  "accountNumber" TEXT,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VendorBankAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "VendorBankAccount_vendorId_idx" ON "VendorBankAccount"("vendorId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VendorBankAccount_vendorId_fkey'
  ) THEN
    ALTER TABLE "VendorBankAccount"
      ADD CONSTRAINT "VendorBankAccount_vendorId_fkey"
      FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
