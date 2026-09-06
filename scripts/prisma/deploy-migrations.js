const { spawnSync } = require('node:child_process')

const FAILED_WEBSITE_TEAM_MIGRATION = '20260728103000_add_website_team_members'

function runPrisma(args) {
  const result = spawnSync('npx', ['prisma', ...args], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
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

function runDeployWithRetry(maxRetries = 5) {
  let result
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Attempt ${attempt}/${maxRetries}] Running prisma migrate deploy...`)
    result = runPrisma(['migrate', 'deploy'])
    if (result.status === 0) {
      return result
    }

    const deployOutput = outputFor(result)
    const isLockOrTimeout =
      deployOutput.includes('P1002') ||
      deployOutput.includes('P1001') ||
      deployOutput.includes('pg_advisory_lock') ||
      deployOutput.includes('Timed out trying to acquire') ||
      deployOutput.includes('connect ETIMEDOUT') ||
      deployOutput.includes('Connection timed out')

    if (isLockOrTimeout && attempt < maxRetries) {
      const delay = attempt * 10000 // 10s, 20s, 30s, 40s back-off
      console.log(
        `[Attempt ${attempt}/${maxRetries}] Postgres lock/timeout error detected. Retrying in ${delay / 1000}s...`,
      )
      sleepSync(delay)
    } else {
      break
    }
  }
  return result
}

let deploy = runDeployWithRetry(5)

if (deploy.status === 0) {
  process.exit(0)
}

const deployOutput = outputFor(deploy)
const isRecoverableWebsiteTeamFailure =
  deployOutput.includes('P3009') &&
  deployOutput.includes(FAILED_WEBSITE_TEAM_MIGRATION)

if (!isRecoverableWebsiteTeamFailure) {
  process.exit(deploy.status ?? 1)
}

console.log(
  `Detected failed Prisma migration ${FAILED_WEBSITE_TEAM_MIGRATION}; marking it rolled back before retrying deploy.`,
)

const resolve = runPrisma([
  'migrate',
  'resolve',
  '--rolled-back',
  FAILED_WEBSITE_TEAM_MIGRATION,
])

if (resolve.status !== 0) {
  process.exit(resolve.status ?? 1)
}

deploy = runDeployWithRetry(5)
process.exit(deploy.status ?? 1)
