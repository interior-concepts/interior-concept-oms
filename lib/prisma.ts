import { PrismaClient } from "@/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import 'dotenv/config'
import { normalizeDatabaseUrlSslMode } from '@/lib/database-url'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const DEFAULT_MOCK_DEPARTMENTS = [
  { id: 'dept-admin', name: 'ADMIN', description: 'System Administration' },
  { id: 'dept-sr-crm', name: 'SR_CRM', description: 'Senior CRM' },
  { id: 'dept-jr-crm', name: 'JR_CRM', description: 'Junior CRM' },
  { id: 'dept-jr-arch', name: 'JR_ARCHITECT', description: 'Junior Architect' },
  { id: 'dept-visit', name: 'VISIT_TEAM', description: 'Visit Team' },
  { id: 'dept-quotation', name: 'QUOTATION_TEAM', description: 'Quotation Team' },
  { id: 'dept-visualizer', name: 'VISUALIZER_3D', description: '3D Visualizer' },
  { id: 'dept-finance', name: 'FINANCE', description: 'Finance' },
  { id: 'dept-accounts', name: 'ACCOUNTS', description: 'Accounts' },
  { id: 'dept-boq', name: 'BOQ', description: 'BOQ Team' },
]

const DEFAULT_MOCK_USER = {
  id: 'mock-user-1',
  clerkUserId: 'dev_preview_user',
  fullName: 'Workspace Admin',
  email: 'admin@interiorconcepts.local',
  phone: '+8801700000000',
  isActive: true,
  created_at: new Date(),
  updated_at: new Date(),
  userRoles: [
    { role: { id: 'role-admin', name: 'Admin' } },
    { role: { id: 'role-visit-lead', name: 'Visit Team Leader' } },
    { role: { id: 'role-jr-arch-lead', name: 'JR Architect Leader' } },
  ],
  userDepartments: DEFAULT_MOCK_DEPARTMENTS.map((dept) => ({
    department: dept,
  })),
}

function getDemoDates() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const d1 = new Date(year, month, Math.min(now.getDate(), 25), 11, 0, 0)
  const d2 = new Date(year, month, Math.max(1, Math.min(now.getDate() - 2, 20)), 14, 30, 0)
  const d3 = new Date(year, month, Math.min(now.getDate() + 2, 27), 16, 0, 0)
  return { d1, d2, d3 }
}

const DEMO_JR_ARCHITECTS = [
  {
    id: 'jr-arch-1',
    fullName: 'Arifur Rahman (JR Arch)',
    email: 'arif@interiorconcepts.local',
    phone: '+8801711111111',
    isActive: true,
  },
  {
    id: 'jr-arch-2',
    fullName: 'Nusrat Jahan (JR Arch)',
    email: 'nusrat@interiorconcepts.local',
    phone: '+8801722222222',
    isActive: true,
  },
]

function getModelMock(modelName: string) {
  const { d1, d2, d3 } = getDemoDates()

  if (modelName === 'user') {
    return {
      ...noOpModel,
      findUnique: async () => DEFAULT_MOCK_USER,
      findFirst: async () => DEFAULT_MOCK_USER,
      findUniqueOrThrow: async () => DEFAULT_MOCK_USER,
      findMany: async () => [DEFAULT_MOCK_USER, ...DEMO_JR_ARCHITECTS],
    }
  }

  if (modelName === 'department') {
    return {
      ...noOpModel,
      findMany: async () => DEFAULT_MOCK_DEPARTMENTS,
      findUnique: async () => DEFAULT_MOCK_DEPARTMENTS[0],
      findFirst: async () => DEFAULT_MOCK_DEPARTMENTS[0],
    }
  }

  if (modelName === 'userDepartment') {
    return {
      ...noOpModel,
      findFirst: async () => ({
        userId: DEFAULT_MOCK_USER.id,
        departmentId: 'dept-admin',
        user: DEFAULT_MOCK_USER,
        department: DEFAULT_MOCK_DEPARTMENTS[0],
      }),
      findMany: async () =>
        DEMO_JR_ARCHITECTS.map((u) => ({
          userId: u.id,
          departmentId: 'dept-jr-arch',
          user: u,
          department: { id: 'dept-jr-arch', name: 'JR_ARCHITECT' },
        })),
    }
  }

  return noOpModel
}

const noOpModel = {
  findMany: async () => [],
  findFirst: async () => null,
  findFirstOrThrow: async () => ({}),
  findUnique: async () => null,
  findUniqueOrThrow: async () => ({}),
  count: async () => 0,
  groupBy: async () => [],
  aggregate: async () => ({ _sum: {}, _count: {}, _avg: {}, _min: {}, _max: {} }),
  create: async (d?: { data?: Record<string, unknown> }) => ({ id: 'mock-id', ...(d?.data ?? {}) }),
  createMany: async () => ({ count: 0 }),
  update: async (d?: { data?: Record<string, unknown> }) => ({ id: 'mock-id', ...(d?.data ?? {}) }),
  updateMany: async () => ({ count: 0 }),
  upsert: async (d?: { create?: Record<string, unknown>; update?: Record<string, unknown> }) => ({
    id: 'mock-id',
    ...(d?.create ?? d?.update ?? {}),
  }),
  delete: async () => ({}),
  deleteMany: async () => ({ count: 0 }),
}

function createMockPrisma(): PrismaClient {
  const proxy: unknown = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') return undefined
        if (prop === '$transaction') {
          return async (arg: unknown) => {
            if (typeof arg === 'function') {
              return (arg as (tx: unknown) => unknown)(proxy)
            }
            if (Array.isArray(arg)) {
              return Promise.all(arg)
            }
            return null
          }
        }
        if (prop === '$queryRaw' || prop === '$queryRawUnsafe') {
          return async () => []
        }
        if (prop === '$executeRaw' || prop === '$executeRawUnsafe') {
          return async () => 0
        }
        if (prop === '$connect' || prop === '$disconnect') {
          return async () => {}
        }
        return getModelMock(String(prop))
      },
    },
  )
  return proxy as PrismaClient
}

function wrapPrismaWithFallback(client: PrismaClient, mockClient: PrismaClient): PrismaClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'then') return undefined
      let val = Reflect.get(target, prop, receiver)
      if (val === undefined || val === null) {
        val = Reflect.get(mockClient as object, prop)
      }
      if (typeof val === 'function') {
        return async (...args: unknown[]) => {
          try {
            return await (val as (...a: unknown[]) => unknown).apply(target, args)
          } catch (err) {
            console.warn(`[AI Studio] Prisma ${String(prop)} fallback active:`, (err as Error)?.message)
            const mockVal = Reflect.get(mockClient as object, prop)
            if (typeof mockVal === 'function') {
              return (mockVal as (...a: unknown[]) => unknown)(...args)
            }
            return null
          }
        }
      }
      if (typeof val === 'object' && val !== null) {
        const modelMock = getModelMock(String(prop)) as Record<string, (...a: unknown[]) => unknown>
        return new Proxy(val, {
          get(modelTarget, modelProp, modelReceiver) {
            const rawMethod = Reflect.get(modelTarget, modelProp, modelReceiver)
            const method = typeof rawMethod === 'function' ? rawMethod : modelMock[String(modelProp)]
            if (typeof method === 'function') {
              return async (...args: unknown[]) => {
                try {
                  return await (method as (...a: unknown[]) => unknown).apply(modelTarget, args)
                } catch (err) {
                  console.warn(
                    `[AI Studio] Prisma ${String(prop)}.${String(modelProp)} fallback active:`,
                    (err as Error)?.message,
                  )
                  const fallbackFn = modelMock[String(modelProp)]
                  return fallbackFn ? fallbackFn(...args) : null
                }
              }
            }
            return method ?? modelMock[String(modelProp)]
          },
        })
      }
      return val ?? Reflect.get(mockClient as object, prop)
    },
  })
}

const mockPrisma = createMockPrisma()

let prisma: PrismaClient
try {
  const connectionString = normalizeDatabaseUrlSslMode(process.env.DATABASE_URL)
  if (!connectionString) {
    console.warn('[AI Studio] DATABASE_URL not set — using in-memory Prisma mock')
    prisma = mockPrisma
  } else {
    const adapter = new PrismaPg({ connectionString })
    const rawClient =
      globalForPrisma.prisma ||
      new PrismaClient({
        adapter,
      })
    prisma = wrapPrismaWithFallback(rawClient, mockPrisma)
  }
} catch {
  console.warn('[AI Studio] Database not connected — using mock')
  prisma = mockPrisma
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }
export default prisma
