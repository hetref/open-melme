import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { validateMailboxSession } from '@/lib/mailbox'
import { cookies } from 'next/headers'

export async function GET(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session ID from cookie
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('melme_mailbox_session')?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No mailbox session found' },
        { status: 404 }
      )
    }

    // Validate session
    const mailboxSession = await validateMailboxSession(sessionId, session.user.id)

    if (!mailboxSession) {
      // Clear invalid cookie
      cookieStore.delete('melme_mailbox_session')

      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      mailbox: {
        id: mailboxSession.mailbox.id,
        name: mailboxSession.mailbox.name,
        slug: mailboxSession.mailbox.slug,
        senderName: mailboxSession.mailbox.senderName,
        description: mailboxSession.mailbox.description,
        aliases: mailboxSession.mailbox.aliases,
        isActive: mailboxSession.mailbox.isActive,
      },
      expiresAt: mailboxSession.expiresAt,
    })
  } catch (error) {
    console.error('Error validating mailbox session:', error)
    return NextResponse.json(
      { error: 'Failed to validate session' },
      { status: 500 }
    )
  }
}
