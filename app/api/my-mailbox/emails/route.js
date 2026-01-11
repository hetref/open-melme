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
    const statusFilter = searchParams.get('status') // Filter by email status

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

    // Build filter conditions
    // Include emails where:
    // 1. aliasId matches one of the mailbox aliases, OR
    // 2. aliasId is null AND the email is sent from the mailbox primary address
    const whereConditions = {
      AND: [
        {
          OR: [
            {
              // Emails associated with mailbox aliases
              aliasId: {
                in: aliasIds,
              },
            },
            {
              // Sent emails from mailbox primary address (aliasId is null)
              aliasId: null,
              userId: session.user.id,
              // For sent emails, fromEmail should match mailbox email
              fromEmail: mailboxSession.mailbox.emailAlias,
            },
          ],
        },
      ],
    }

    // Apply filters
    if (query) {
      whereConditions.AND.push({
        OR: [
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
        ],
      })
    }

    if (fromEmail) {
      whereConditions.AND.push({
        fromEmail: {
          contains: fromEmail,
          mode: 'insensitive',
        },
      })
    }

    if (filterAliasId && aliasIds.includes(filterAliasId)) {
      // Override the main OR condition to filter by specific alias
      whereConditions.AND = [
        {
          aliasId: filterAliasId,
        },
      ]
    }

    if (hasAttachments === 'true') {
      whereConditions.AND.push({
        attachmentsStatus: 'completed',
      })
    }

    if (dateFrom) {
      whereConditions.AND.push({
        createdAt: {
          gte: new Date(dateFrom),
        },
      })
    }

    if (dateTo) {
      whereConditions.AND.push({
        createdAt: {
          lte: new Date(dateTo),
        },
      })
    }

    // Filter by status (received, sent, etc.)
    if (statusFilter) {
      whereConditions.AND.push({
        status: statusFilter,
      })
    }

    // Get emails (for conversation grouping)
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
        conversationId: true,
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
    })

    // Group emails by conversation
    const conversationMap = new Map()
    for (const email of emails) {
      const convId = email.conversationId || email.id // Fallback to email ID for null conversationId
      if (!conversationMap.has(convId)) {
        conversationMap.set(convId, {
          conversationId: convId,
          emails: [],
          lastEmail: null,
          messageCount: 0,
          hasAttachments: false,
        })
      }
      const conversation = conversationMap.get(convId)
      conversation.emails.push(email)
      conversation.messageCount++
      if (email.attachmentsStatus === 'completed') {
        conversation.hasAttachments = true
      }
      // Track latest email for display
      if (!conversation.lastEmail || email.createdAt > conversation.lastEmail.createdAt) {
        conversation.lastEmail = email
      }
    }

    // Convert to array and sort by last email time
    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => b.lastEmail.createdAt - a.lastEmail.createdAt)
      .slice(skip, skip + limit) // Apply pagination to conversations

    const totalConversations = conversationMap.size
    const totalPages = Math.ceil(totalConversations / limit)

    return NextResponse.json({
      conversations,
      pagination: {
        page,
        limit,
        totalCount: totalConversations,
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
