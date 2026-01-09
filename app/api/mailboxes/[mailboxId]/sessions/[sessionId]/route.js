import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'

// DELETE /api/mailboxes/[mailboxId]/sessions/[sessionId] - Revoke a session
export async function DELETE(request, { params }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mailboxId, sessionId } = await params

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

    // Verify session belongs to this mailbox
    const mailboxSession = await prisma.mailboxSession.findUnique({
      where: {
        id: sessionId,
        mailboxId: mailboxId,
      },
    })

    if (!mailboxSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Delete the session
    await prisma.mailboxSession.delete({
      where: {
        id: sessionId,
      },
    })

    return NextResponse.json({
      message: 'Session revoked successfully',
    })
  } catch (error) {
    console.error('Error revoking session:', error)
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    )
  }
}
