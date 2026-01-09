import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { revokeMailboxSession } from '@/lib/mailbox'
import { cookies } from 'next/headers'

export async function POST(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
