import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validateMailboxSession } from '@/lib/mailbox'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get and validate mailbox session
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('melme_mailbox_session')?.value

    const mailboxSession = await validateMailboxSession(sessionId, session.user.id)

    if (!mailboxSession) {
      return NextResponse.json(
        { error: 'Invalid or expired mailbox session' },
        { status: 401 }
      )
    }

    // Get pagination parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100) // Max 100
    const skip = (page - 1) * limit

    // Get filter parameters
    const query = searchParams.get('query') || '' // Search in subject + from
    const fromEmail = searchParams.get('from') || ''
    const filterAliasId = searchParams.get('aliasId') || ''
    const hasAttachments = searchParams.get('hasAttachments')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Get aliases for this mailbox
    const aliases = await prisma.alias.findMany({
      where: {
        mailboxId: mailboxSession.mailbox.id,
      },
      select: {
        id: true,
      },
    })

    const aliasIds = aliases.map((alias) => alias.id)

    if (aliasIds.length === 0) {
      return NextResponse.json({
        emails: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0,
          hasMore: false,
        },
      })
    }

    // Build filter conditions
    const whereConditions = {
      aliasId: {
        in: aliasIds,
      },
    }

    // Apply filters
    if (query) {
      whereConditions.OR = [
        {
          subject: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          fromEmail: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ]
    }

    if (fromEmail) {
      whereConditions.fromEmail = {
        contains: fromEmail,
        mode: 'insensitive',
      }
    }

    if (filterAliasId && aliasIds.includes(filterAliasId)) {
      whereConditions.aliasId = filterAliasId
    }

    if (hasAttachments === 'true') {
      whereConditions.attachmentsStatus = 'completed'
    }

    if (dateFrom) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        gte: new Date(dateFrom),
      }
    }

    if (dateTo) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        lte: new Date(dateTo),
      }
    }

    // Get total count
    const totalCount = await prisma.emailLog.count({
      where: whereConditions,
    })

    // Get emails
    const emails = await prisma.emailLog.findMany({
      where: whereConditions,
      select: {
        id: true,
        fromEmail: true,
        toEmail: true,
        subject: true,
        status: true,
        size: true,
        createdAt: true,
        attachmentsStatus: true,
        alias: {
          select: {
            id: true,
            localPart: true,
          },
        },
        _count: {
          select: {
            attachments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching mailbox emails:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    )
  }
}
