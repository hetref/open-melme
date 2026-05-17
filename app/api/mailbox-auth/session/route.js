import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getValidatedMailboxSession } from '@/lib/mailboxAuth'

export async function GET(req) {
  try {
    const cookieStore = await cookies()
    const mailboxSession = await getValidatedMailboxSession(req, cookieStore)

    if (!mailboxSession) {
      // Clear the cookie if it exists (web cleanup only)
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
        senderName: mailboxSession.mailbox.senderName,
        personalEmail: mailboxSession.mailbox.personalEmail,
        assignedPersonalEmails: mailboxSession.mailbox.assignedPersonalEmails,
        tags: mailboxSession.mailbox.tags,
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
