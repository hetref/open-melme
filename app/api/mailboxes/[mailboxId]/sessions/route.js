import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/mailboxes/[mailboxId]/sessions - Get mailbox sessions
export async function GET(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId } = await params

    // Verify mailbox ownership
    const mailbox = await prisma.mailbox.findUnique({
      where: {
        id: mailboxId,
        userId: session.user.id,
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    // Get all sessions for this mailbox (including expired ones for history)
    const sessions = await prisma.mailboxSession.findMany({
      where: {
        mailboxId: mailboxId,
        expiresAt: {
          gte: new Date(), // Only active sessions
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    return NextResponse.json({
      sessions,
      count: sessions.length,
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}
