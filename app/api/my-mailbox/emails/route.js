import { NextResponse } from 'next/server'
import { validateMailboxSession } from '@/lib/mailbox'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(req) {
  try {
    // Get and validate mailbox session
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('melme_mailbox_session')?.value

    const mailboxSession = await validateMailboxSession(sessionId)

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
          // Emails associated with mailbox aliases only
          aliasId: {
            in: aliasIds,
          },
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

    // STEP 1: Get all emails matching filters (needed for conversation grouping)
    // But only fetch minimal data for grouping
    const allEmails = await prisma.emailLog.findMany({
      where: whereConditions,
      select: {
        id: true,
        conversationId: true,
        createdAt: true,
        attachmentsStatus: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // STEP 2: Group by conversation in JS (unavoidable, but optimized)
    const conversationMap = new Map()
    for (const email of allEmails) {
      const convKey = email.conversationId || email.id

      if (!conversationMap.has(convKey)) {
        conversationMap.set(convKey, {
          conversationKey: convKey,
          lastMessageAt: email.createdAt,
          messageCount: 1,
          hasAttachments: email.attachmentsStatus === 'completed',
          emailIds: [email.id],
        })
      } else {
        const conv = conversationMap.get(convKey)
        conv.messageCount++
        if (email.attachmentsStatus === 'completed') {
          conv.hasAttachments = true
        }
        // Update last message time if this email is newer
        if (email.createdAt > conv.lastMessageAt) {
          conv.lastMessageAt = email.createdAt
        }
        conv.emailIds.push(email.id)
      }
    }

    // STEP 3: Sort conversations by lastMessageAt DESC
    const sortedConversations = Array.from(conversationMap.values())
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)

    // STEP 4: Apply pagination to conversations
    const paginatedConversations = sortedConversations.slice(skip, skip + limit)

    // STEP 5: Fetch full details only for paginated conversations' last emails
    const lastEmailIds = paginatedConversations.map(conv =>
      // Find the email with the latest createdAt from emailIds
      allEmails
        .filter(e => conv.emailIds.includes(e.id))
        .sort((a, b) => b.createdAt - a.createdAt)[0].id
    )

    const lastEmails = await prisma.emailLog.findMany({
      where: {
        id: {
          in: lastEmailIds,
        },
      },
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
    })

    // Create a map for quick lookup
    const emailMap = new Map(lastEmails.map(e => [e.id, e]))

    // STEP 6: Build final response maintaining sort order
    const conversations = paginatedConversations.map(conv => {
      const lastEmailId = allEmails
        .filter(e => conv.emailIds.includes(e.id))
        .sort((a, b) => b.createdAt - a.createdAt)[0].id

      return {
        conversationId: conv.conversationKey,
        lastEmail: emailMap.get(lastEmailId),
        messageCount: conv.messageCount,
        hasAttachments: conv.hasAttachments,
      }
    })

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
