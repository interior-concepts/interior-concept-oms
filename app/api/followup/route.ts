import prisma from '@/lib/prisma';
import { Prisma, FollowUpStatus, LeadAssignmentDepartment } from '@/generated/prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { parseScheduledAtDate } from '@/lib/date-utils';

// GET /api/followup - Get all follow-ups with optional filtering and connected Jr/Sr CRM data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Filtering
    const leadId = searchParams.get('leadId')
    const assignedToId = searchParams.get('assignedToId')
    const myUserId = searchParams.get('myUserId')
    const crmType = searchParams.get('crmType')?.toUpperCase() // 'ALL', 'JR_CRM', 'SR_CRM', 'MY'
    const department = searchParams.get('department')?.toUpperCase()
    const search = searchParams.get('search')?.trim()
    const status = searchParams.get('status') as FollowUpStatus | null
    const statusesParam = searchParams.get('statuses')
    const upcoming = searchParams.get('upcoming') === 'true'
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Build where clause using AND conditions to avoid overwriting OR filters
    const andConditions: Prisma.FollowUpWhereInput[] = []

    if (leadId) andConditions.push({ leadId })

    // Department / crmType & assignedToId filtering
    const filterDept = department || (crmType && crmType !== 'ALL' && crmType !== 'MY' ? crmType : null)

    if (crmType === 'MY') {
      let targetUserId = assignedToId || myUserId
      if (!targetUserId) {
        const { userId: clerkUserId } = await auth()
        if (clerkUserId) {
          const user = await prisma.user.findUnique({
            where: { clerkUserId },
            select: { id: true },
          })
          targetUserId = user?.id ?? null
        }
      }
      if (targetUserId) {
        andConditions.push({ assignedToId: targetUserId })
      }
    } else if (filterDept) {
      andConditions.push({
        OR: [
          {
            assignedTo: {
              userDepartments: {
                some: {
                  department: {
                    name: filterDept,
                  },
                },
              },
            },
          },
          {
            lead: {
              assignments: {
                some: {
                  department: filterDept as LeadAssignmentDepartment,
                },
              },
            },
          },
        ],
      })
    } else if (assignedToId) {
      andConditions.push({ assignedToId })
    }

    // Search query across lead name, phone, email, notes
    if (search && search.length > 0) {
      andConditions.push({
        OR: [
          { lead: { name: { contains: search, mode: 'insensitive' } } },
          { lead: { phone: { contains: search, mode: 'insensitive' } } },
          { lead: { email: { contains: search, mode: 'insensitive' } } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    const parsedStatuses = statusesParam
      ?.split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value): value is FollowUpStatus =>
        Object.values(FollowUpStatus).includes(value as FollowUpStatus),
      ) ?? []

    if (parsedStatuses.length > 0) {
      andConditions.push({ status: { in: parsedStatuses } })
    } else if (status && Object.values(FollowUpStatus).includes(status)) {
      andConditions.push({ status })
    }

    if (upcoming) {
      andConditions.push({
        followupDate: { gte: new Date() },
        status: FollowUpStatus.PENDING,
      })
    }

    const fromDate = from ? parseScheduledAtDate(from) || new Date(from) : null
    const toDate = to ? parseScheduledAtDate(to) || new Date(to) : null
    if (from && (!fromDate || Number.isNaN(fromDate.getTime()))) {
      return NextResponse.json(
        { success: false, error: 'Invalid "from" date' },
        { status: 400 },
      )
    }
    if (to && (!toDate || Number.isNaN(toDate.getTime()))) {
      return NextResponse.json(
        { success: false, error: 'Invalid "to" date' },
        { status: 400 },
      )
    }
    if (fromDate || toDate) {
      andConditions.push({
        followupDate: {
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDate ? { lte: toDate } : {}),
        },
      })
    }

    const where: Prisma.FollowUpWhereInput = andConditions.length > 0 ? { AND: andConditions } : {}

    const isCompletedQuery =
      status === FollowUpStatus.DONE ||
      status === FollowUpStatus.LATELY_DONE ||
      parsedStatuses.includes(FollowUpStatus.DONE)

    // Get follow-ups with connected lead & team info
    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              stage: true,
              subStatus: true,
              assignments: {
                select: {
                  id: true,
                  department: true,
                  user: {
                    select: { id: true, fullName: true, email: true },
                  },
                },
              },
            },
          },
          assignedTo: {
            select: {
              id: true,
              fullName: true,
              email: true,
              userDepartments: {
                select: {
                  department: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { followupDate: isCompletedQuery ? 'desc' : 'asc' },
      }),
      prisma.followUp.count({ where }),
    ])

    // Fetch lead connected follow-up counts for all returned leads
    const leadIds = Array.from(new Set(followUps.map((f) => f.leadId)))
    const leadFollowUpCounts = await prisma.followUp.groupBy({
      by: ['leadId'],
      where: { leadId: { in: leadIds } },
      _count: { id: true },
    })
    const countMap = new Map(leadFollowUpCounts.map((c) => [c.leadId, c._count.id]))

    // Enriched follow-ups with connected department and CRM metadata
    const enrichedData = followUps.map((f) => {
      const assignedDeptNames = (f.assignedTo.userDepartments ?? []).map((ud) => ud.department?.name).filter(Boolean) as string[]
      const leadAssignments = f.lead.assignments ?? []
      const leadMatch = leadAssignments.find((a) => a.user.id === f.assignedToId)

      const isJrCrm = assignedDeptNames.includes('JR_CRM') || leadMatch?.department === 'JR_CRM'
      const isSrCrm = assignedDeptNames.includes('SR_CRM') || leadMatch?.department === 'SR_CRM'

      const departmentRole = leadMatch?.department || (assignedDeptNames.length > 0 ? assignedDeptNames[0] : null) || (isSrCrm ? 'SR_CRM' : isJrCrm ? 'JR_CRM' : 'GENERAL')

      const crmRole: 'JR_CRM' | 'SR_CRM' | 'GENERAL' = isSrCrm
        ? 'SR_CRM'
        : isJrCrm
          ? 'JR_CRM'
          : 'GENERAL'

      const jrAssignment = leadAssignments.find((a) => a.department === LeadAssignmentDepartment.JR_CRM)
      const srAssignment = leadAssignments.find((a) => a.department === LeadAssignmentDepartment.SR_CRM)

      return {
        ...f,
        crmRole,
        departmentRole,
        leadAssignments,
        connectedLeadFollowupsCount: countMap.get(f.leadId) ?? 1,
        assignedJrCrm: jrAssignment?.user ?? null,
        assignedSrCrm: srAssignment?.user ?? null,
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch follow-ups',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
