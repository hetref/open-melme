import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { validateMailboxSession } from '@/lib/mailbox'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('melme_mailbox_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'No mailbox session' }, { status: 401 })
    }

    const mailboxSession = await validateMailboxSession(sessionToken)

    if (!mailboxSession) {
      return NextResponse.json({ error: 'Invalid or expired mailbox session' }, { status: 401 })
    }

    const payload = await request.json().catch(() => ({}))
    const emailId = payload?.emailId
    const conversationId = payload?.conversationId

    if (!emailId && !conversationId) {
      return NextResponse.json({ error: 'Email ID or conversation ID is required' }, { status: 400 })
    }

    const aliases = await prisma.alias.findMany({
      where: {
        mailboxId: mailboxSession.mailbox.id,
      },
      select: {
        id: true,
      },
    })

    const aliasIds = aliases.map((alias) => alias.id)

    let targetConversationId = conversationId
    let targetEmailId = emailId

    if (!targetConversationId && targetEmailId) {
      const email = await prisma.emailLog.findFirst({
        where: {
          id: targetEmailId,
          aliasId: {
            in: aliasIds,
          },
        },
        select: {
          id: true,
          conversationId: true,
        },
      })

      if (!email) {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 })
      }

      targetConversationId = email.conversationId
      targetEmailId = email.id
    }

    const now = new Date()
    const updateWhere = targetConversationId
      ? {
        conversationId: targetConversationId,
        aliasId: {
          in: aliasIds,
        },
        status: 'received',
        readAt: null,
      }
      : {
        id: targetEmailId,
        aliasId: {
          in: aliasIds,
        },
        status: 'received',
        readAt: null,
      }

    const result = await prisma.emailLog.updateMany({
      where: updateWhere,
      data: {
        readAt: now,
      },
    })

    return NextResponse.json({
      success: true,
      markedRead: result.count,
      conversationId: targetConversationId || targetEmailId,
    })
  } catch (error) {
    console.error('Error marking emails as read:', error)
    return NextResponse.json({ error: 'Failed to mark emails as read' }, { status: 500 })
  }
}
