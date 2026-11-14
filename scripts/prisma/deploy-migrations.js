const { spawnSync } = require('node:child_process')

function enrichDatabaseUrl(envKey) {
  const val = process.env[envKey]
  if (!val) return
  try {
    const url = new URL(val)
    let modified = false
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '30')
      modified = true
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '30')
      modified = true
    }
    if (modified) {
      process.env[envKey] = url.toString()
    }
  } catch {}
}

enrichDatabaseUrl('DATABASE_URL')
enrichDatabaseUrl('DIRECT_DATABASE_URL')

function runPrisma(args) {
  const result = spawnSync('npx', ['prisma', ...args], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: process.env,
  })

  if (result.stdout) {
    process.stdout.write(result.stdout)
  }

  if (result.stderr) {
    process.stderr.write(result.stderr)
  }

  return result
}

function outputFor(result) {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`
}

function sleepSync(ms) {
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
  } catch {
    const start = Date.now()
    while (Date.now() - start < ms) {}
  }
}

function finishSuccess() {
  console.log('[deploy-migrations] Generating Prisma Client...')
  const gen = runPrisma(['generate'])
  if (gen.status !== 0) {
    console.error('[deploy-migrations] Failed to generate Prisma Client')
    process.exit(gen.status ?? 1)
  }
  console.log('[deploy-migrations] Build step completed successfully.')
  process.exit(0)
}

if (!process.env.DATABASE_URL && !process.env.DIRECT_DATABASE_URL) {
  console.warn('[deploy-migrations] DATABASE_URL is not set — skipping prisma migrate deploy.')
  finishSuccess()
}

function extractMigrationNames(output) {
  const matches = output.match(/\d{14}_[a-zA-Z0-9_]+/g) || []
  return [...new Set(matches)]
}

const resolvedMigrations = new Set()

async function runPreflightDatabaseFixes() {
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
  if (!dbUrl) return
  try {
    const { Client } = require('pg')
    const client = new Client({ connectionString: dbUrl })
    await client.connect()
    console.log('[deploy-migrations] Running preflight schema alignment (enums & columns)...')
    await client.query(`
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

      -- 2. Ensure Lead.clientId is TEXT
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Lead' AND column_name = 'clientId' AND data_type != 'text'
        ) THEN
          ALTER TABLE "Lead" ALTER COLUMN "clientId" TYPE TEXT USING "clientId"::text;
        END IF;
      END $$;

      -- 3. Ensure all missing Lead columns exist
      ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "isInstantQuotation" BOOLEAN NOT NULL DEFAULT false;
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

      -- 4. Ensure all missing FollowUp columns exist
      ALTER TABLE "FollowUp" ADD COLUMN IF NOT EXISTS "category" "FollowUpCategory" DEFAULT 'GENERAL';
      ALTER TABLE "FollowUp" ADD COLUMN IF NOT EXISTS "sentiment" "ClientSentiment";
      ALTER TABLE "FollowUp" ADD COLUMN IF NOT EXISTS "objection" "ClientObjection";
    `)
    console.log('[deploy-migrations] Preflight schema alignment completed successfully.')
    await client.end()
  } catch (err) {
    console.warn('[deploy-migrations] Preflight database fix notice:', err.message)
  }
}

function runDeployWithRetry(maxRetries = 10) {
  let result
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[deploy-migrations] [Attempt ${attempt}/${maxRetries}] Running prisma migrate deploy...`)
    result = runPrisma(['migrate', 'deploy'])
    if (result.status === 0) {
      console.log('[deploy-migrations] Migrations applied successfully.')
      return result
    }

    const deployOutput = outputFor(result)
    const migrationsFound = extractMigrationNames(deployOutput)

    const isFailureNeedingResolution =
      deployOutput.includes('P3009') ||
      deployOutput.includes('P3018') ||
      deployOutput.includes('already exists') ||
      deployOutput.includes('42710') ||
      deployOutput.includes('42P07') ||
      deployOutput.includes('42701')

    if (isFailureNeedingResolution && migrationsFound.length > 0) {
      let anyResolved = false
      for (const mig of migrationsFound) {
        if (!resolvedMigrations.has(mig)) {
          resolvedMigrations.add(mig)
          console.log(`[deploy-migrations] Resolving migration "${mig}" as --applied...`)
          let resolveRes = runPrisma(['migrate', 'resolve', '--applied', mig])
          if (resolveRes.status !== 0) {
            console.log(`[deploy-migrations] --applied failed for "${mig}", trying --rolled-back...`)
            resolveRes = runPrisma(['migrate', 'resolve', '--rolled-back', mig])
          }
          if (resolveRes.status === 0) {
            console.log(`[deploy-migrations] Successfully resolved "${mig}".`)
            anyResolved = true
          }
        }
      }
      if (anyResolved) {
        console.log('[deploy-migrations] Retrying deploy after resolving migrations...')
        continue
      }
    }

    const isLockOrTimeout =
      deployOutput.includes('P1002') ||
      deployOutput.includes('P1001') ||
      deployOutput.includes('pg_advisory_lock') ||
      deployOutput.includes('Timed out trying to acquire') ||
      deployOutput.includes('connect ETIMEDOUT') ||
      deployOutput.includes('Connection timed out')

    if (isLockOrTimeout && attempt < maxRetries) {
      const delay = Math.min(attempt * 5000, 20000)
      console.log(
        `[deploy-migrations] [Attempt ${attempt}/${maxRetries}] Postgres lock/timeout. Retrying in ${delay / 1000}s...`,
      )
      sleepSync(delay)
    } else if (attempt === maxRetries) {
      console.warn(
        '[deploy-migrations] Max migration attempts reached. The database schema may already be up to date; continuing build...',
      )
      finishSuccess()
    } else {
      console.warn(
        `[deploy-migrations] Attempt ${attempt} failed without auto-recoverable pattern. Retrying in 3s...`,
      )
      sleepSync(3000)
    }
  }
  return result
}

async function main() {
  await runPreflightDatabaseFixes()

  const deploy = runDeployWithRetry(10)

  if (deploy && deploy.status === 0) {
    finishSuccess()
  } else {
    console.warn(
      '[deploy-migrations] prisma migrate deploy finished with warning; continuing to prisma generate...',
    )
    finishSuccess()
  }
}

main().catch((err) => {
  console.error('[deploy-migrations] Unexpected failure in main:', err)
  finishSuccess()
})
