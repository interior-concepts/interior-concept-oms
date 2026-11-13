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

function extractFailedMigration(output) {
  const nameMatch = output.match(/Migration name:\s*([^\s\r\n]+)/)
  if (nameMatch) return nameMatch[1].trim()
  const applyMatch = output.match(/Applying migration\s*[`'"]([^`'"]+)[`'"]/)
  if (applyMatch) return applyMatch[1].trim()
  return null
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
    const failedMigration = extractFailedMigration(deployOutput)

    const isAlreadyExists =
      deployOutput.includes('already exists') ||
      deployOutput.includes('42710') ||
      deployOutput.includes('42P07') ||
      deployOutput.includes('42701')

    // If an object/enum/table already exists, resolve it as applied
    if (failedMigration && isAlreadyExists && !resolvedMigrations.has(failedMigration)) {
      resolvedMigrations.add(failedMigration)
      console.log(
        `[deploy-migrations] Migration "${failedMigration}" failed because target already exists. Marking as applied...`,
      )
      const resolveResult = runPrisma(['migrate', 'resolve', '--applied', failedMigration])
      if (resolveResult.status === 0) {
        console.log(`[deploy-migrations] Successfully marked "${failedMigration}" as applied. Retrying deploy...`)
        continue
      }
    }

    // Handle P3009/P3018 (migration failed to apply in earlier step)
    if (
      failedMigration &&
      (deployOutput.includes('P3009') || deployOutput.includes('P3018')) &&
      !resolvedMigrations.has(failedMigration)
    ) {
      resolvedMigrations.add(failedMigration)
      console.log(
        `[deploy-migrations] Detected previously failed migration "${failedMigration}". Resolving as applied...`,
      )
      const resolveResult = runPrisma(['migrate', 'resolve', '--applied', failedMigration])
      if (resolveResult.status === 0) {
        console.log(`[deploy-migrations] Resolved "${failedMigration}". Retrying deploy...`)
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
        `[deploy-migrations] [Attempt ${attempt}/${maxRetries}] Postgres lock/timeout error. Retrying in ${delay / 1000}s...`,
      )
      sleepSync(delay)
    } else {
      break
    }
  }
  return result
}

const deploy = runDeployWithRetry(10)

if (deploy.status === 0) {
  finishSuccess()
} else {
  console.error('[deploy-migrations] prisma migrate deploy failed with exit code:', deploy.status)
  process.exit(deploy.status ?? 1)
}
