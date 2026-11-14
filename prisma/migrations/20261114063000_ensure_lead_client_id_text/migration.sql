-- Migration: Ensure all Lead and FollowUp columns and enums exist in PostgreSQL

-- 1. Enums
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountStatus') THEN
    CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientSentiment') THEN
    CREATE TYPE "ClientSentiment" AS ENUM ('HOT', 'WARM', 'COLD', 'AT_RISK');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientObjection') THEN
    CREATE TYPE "ClientObjection" AS ENUM ('BUDGET_TOO_HIGH', 'COMPETITOR_COMPARISON', 'DESIGN_REVISION_NEEDED', 'SPACE_PLANNING_QUERY', 'TIMELINE_DELAY', 'OTHER');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FollowUpCategory') THEN
    CREATE TYPE "FollowUpCategory" AS ENUM ('LAYOUT_REVIEW', 'BUDGET_NEGOTIATION', 'SITE_VISIT', 'CONTRACT_SIGNING', 'GENERAL');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadPrimaryOwnerDepartment') THEN
    CREATE TYPE "LeadPrimaryOwnerDepartment" AS ENUM ('JR_CRM', 'SR_CRM', 'VISIT_TEAM', 'JR_ARCHITECT', 'SDC', 'VISUALIZER_3D', 'ACCOUNT', 'PRODUCTION');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadSubStatus') THEN
    CREATE TYPE "LeadSubStatus" AS ENUM ('CALL_ATTEMPTED', 'NUMBER_COLLECTED', 'INVALID_NUMBER', 'NOT_INTERESTED', 'CALL_LATER', 'VISIT_SCHEDULED', 'VISIT_DONE');
  END IF;
END $$;

-- 2. Lead columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Lead' AND column_name = 'clientId' AND data_type != 'text'
  ) THEN
    ALTER TABLE "Lead" ALTER COLUMN "clientId" TYPE TEXT USING "clientId"::text;
  END IF;
END $$;

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "agreementSqft" DOUBLE PRECISION;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "initialAgreementValue" DOUBLE PRECISION;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "agreementType" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "agreementValue" DOUBLE PRECISION;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "quotationType" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "objectionNote" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "primaryOwnerUserId" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "accountStatus" "AccountStatus";
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "sentiment" "ClientSentiment";
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "objection" "ClientObjection";
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "primaryOwnerDepartment" "LeadPrimaryOwnerDepartment";
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "subStatus" "LeadSubStatus";

-- 3. FollowUp columns
ALTER TABLE "FollowUp" ADD COLUMN IF NOT EXISTS "category" "FollowUpCategory" DEFAULT 'GENERAL';
ALTER TABLE "FollowUp" ADD COLUMN IF NOT EXISTS "sentiment" "ClientSentiment";
ALTER TABLE "FollowUp" ADD COLUMN IF NOT EXISTS "objection" "ClientObjection";
