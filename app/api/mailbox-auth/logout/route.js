import { NextResponse } from 'next/server'
import { revokeMailboxSession } from '@/lib/mailbox'
import { extractSessionId } from '@/lib/mailboxAuth'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    const cookieStore = await cookies()

    // Accept session from Bearer token (React Native) or cookie (web)
    const sessionId = extractSessionId(req, cookieStore)

    if (sessionId) {
      await revokeMailboxSession(sessionId)
    }

    // Clear cookie (no-op for React Native, but cleans up web sessions)
    cookieStore.delete('melme_mailbox_session')

    return NextResponse.json({
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Error logging out of mailbox:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
