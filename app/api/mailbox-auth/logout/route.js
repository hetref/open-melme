import { NextResponse } from 'next/server'
import { revokeMailboxSession } from '@/lib/mailbox'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    // Get session ID from cookie
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('melme_mailbox_session')?.value

    if (sessionId) {
      // Revoke session in database
      await revokeMailboxSession(sessionId)
    }

    // Clear cookie
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
