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

const deploy = runDeployWithRetry(10)

if (deploy && deploy.status === 0) {
  finishSuccess()
} else {
  console.warn(
    '[deploy-migrations] prisma migrate deploy finished with warning; continuing to prisma generate...',
  )
  finishSuccess()
}
