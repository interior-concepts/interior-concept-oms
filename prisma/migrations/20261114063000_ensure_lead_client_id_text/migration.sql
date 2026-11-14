-- Migration: Ensure Lead.clientId column has TEXT data type matching schema.prisma
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Lead' AND column_name = 'clientId' AND data_type != 'text'
  ) THEN
    ALTER TABLE "Lead" ALTER COLUMN "clientId" TYPE TEXT USING "clientId"::text;
  END IF;
END $$;
